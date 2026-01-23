from fastapi import *
from db.deps import get_conn, get_cur
from mysql.connector import Error, IntegrityError, errorcode
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
import os
import time
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.schemas import *
from models.user_model import *

router = APIRouter()


KEY = os.getenv("KEY")
ALGORITHM = os.getenv("ALGORITHM")
bearer = HTTPBearer(auto_error=False) # 為了自定義進來沒token錯誤顯示

def verify_token(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
	if creds is None or not creds.credentials:
		raise HTTPException(status_code=403, detail={"error":True, "message":"未登入系統，請先登入"})
	token = creds.credentials
	try:
		return jwt.decode(token, KEY, algorithms=[ALGORITHM])
	except jwt.ExpiredSignatureError:
		raise HTTPException(status_code=401, detail={"error":True, "message":"Token expired"})
	except jwt.InvalidTokenError:
		raise HTTPException(status_code=401, detail={"error":True, "message":"Invalid token"})

# 補充
# HTTPBearer：FastAPI 內建的「Security dependency」。它會去讀 HTTP request header 的：Authorization: Bearer <token>，解析成功後，會產生一個 HTTPAuthorizationCredentials 物件。
# HTTPAuthorizationCredentials 通常有兩個重要欄位，creds.scheme：字串 "Bearer"，creds.credentials：真正的 token 字串（JWT）

@router.post("/api/user")
def signup(user: Signup, conn = Depends(get_conn)):
	try:
		UserModel.create_user(conn, user.name, user.email, user.password)
		return {"ok":True}
	except IntegrityError as e:
		conn.rollback()
		if e.errno == errorcode.ER_DUP_ENTRY:
			raise HTTPException(status_code=400, detail={"error":True, "message":"Email 已被使用"})
	# 只攔「資料完整性」錯誤（例如 UNIQUE/FK）
	# 這次交易全部撤回，避免半套資料/鎖卡住
	# 判斷是否為「重複鍵」(MySQL 1062)
	# 回給前端 400＋友善訊息
	except Error as e:
		conn.rollback()
		print(f"[DB Error] Create User Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})



@router.put("/api/user/auth")
def login(user: Login,cur = Depends(get_cur)):
	try:
		db_user = UserModel.get_user_by_email(cur, user.email)
		if not db_user or not UserModel.verify_password(user.password, db_user["password_hash"]):
			raise HTTPException(status_code=400, detail={"error":True, "message":"帳號或密碼輸入錯誤"})
		
		token = UserModel.create_token(db_user["id"], db_user["email"], db_user["name"])
		return {"token": token}
	except Error as e:
		print(f"[DB Error] Select User Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})

# HTTPException
# 用途：當發生業務錯誤或權限不足等情況，需要回 400/401/403/404/409/... 這類錯誤碼時使用。
# 會發生什麼：丟出後，FastAPI 不再執行後續程式碼或路由處理器，直接組出錯誤 JSON。
# 回傳格式（預設）：{"detail": <你給的 detail>}

@router.get("/api/user/auth")
def get_current_user(user = Depends(verify_token), cur = Depends(get_cur)):
	user_id = user["sub"]

	try:
		db_user = UserModel.get_user_by_id(cur, user_id)
		if not db_user:
			raise HTTPException(status_code=404, detail={"error":True, "message":"找不到使用者"})
		
		return {"data": {"id": user_id, "name": db_user["name"], "email": db_user["email"], "avatar_url": db_user["avatar_url"]}}
	except Error as e:
		print(f"[DB Error] Get User Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})


@router.patch("/api/user")
def update_user(
	payload: UpdateUser, 
	user = Depends(verify_token),
	conn = Depends(get_conn)
):
	user_id = int(user["sub"])
	user_email = user["email"]
	new_name = payload.name
	new_password = payload.new_password
	old_password = payload.old_password
	
	# 有可能不改密碼，有的話兩個都要有
	if new_password and not old_password:
		raise HTTPException(status_code=400, detail={"error":True, "message":"新密碼與舊密碼請輸入完整"})
	if not new_password and old_password:
		raise HTTPException(status_code=400, detail={"error":True, "message":"新密碼與舊密碼請輸入完整"})
	new_password_hash = None
	try:
		cur = conn.cursor(dictionary=True)
		if new_password and old_password:
		# DB找密碼
			db_user = UserModel.get_user_by_id(cur, user_id)
			# 舊密碼驗證
			if not UserModel.verify_password(old_password, db_user["password_hash"]):
				raise HTTPException(status_code=400, detail={"error":True, "message":"舊密碼輸入錯誤"})
			# 新密碼驗證
			if UserModel.verify_password(new_password, db_user["password_hash"]):
				raise HTTPException(status_code=400, detail={"error":True, "message":"新密碼不可與舊密碼相同"})
			
			new_password_hash = UserModel.hash_password(new_password)
		
		# 姓名與新密碼一起改
		UserModel.update_user_info(conn, user_id, new_name, new_password_hash)
		
		# 更新token
		token = UserModel.create_token(user_id, user_email, new_name)

		return {"ok": True, "token": token}
	except Error as e:
		conn.rollback()
		print(f"[DB Error] Update user Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})



UPLOAD_DIR = "static/icon/upload"

@router.patch("/api/user/avatar")
async def upload_avatar(
	file: UploadFile = File(...),
	user = Depends(verify_token),
	conn = Depends(get_conn)
):
	user_id = int(user["sub"])
	cur = conn.cursor(dictionary=True)
	try:
		# 檢查該使用者是否已有圖片
		db_user = UserModel.get_user_by_id(cur, user_id)
		
		if db_user and db_user["avatar_url"]:
			# 取得舊路徑 (例如: /static/uploads/user_1_old.jpg)
			# 因為存的是以 / 開頭的 URL，我們要去掉第一個斜線，os 才能找到正確路徑
			old_file_path = db_user["avatar_url"].lstrip("/") # 移除最左邊的"/"

			if os.path.exists(old_file_path): # 檢查檔案是否存在
				os.remove(old_file_path)  # 存在之後才刪除檔案
				print(f"成功刪掉舊圖，{old_file_path}") 

		# 準備建立新的圖片
		# 驗證傳入檔案類型
		if file.content_type not in ["image/jpeg", "image/png"]: 
			# file.content_type 是瀏覽器在傳送檔案時附帶的 MIME Type 資訊，我們不檢查檔案副檔名，而是檢查檔案的實質類型。
			raise HTTPException(status_code=400, detail={"error":True, "message":"檔案類型錯誤"})
		# 驗證大小
		contents = await file.read() # 它會把整張圖片的二進位資料讀進伺服器的記憶體中。len() 算出來會是Bytes大小
		if len(contents) > 10 * 1024 * 1024:
			raise HTTPException(status_code=400, detail={"error":True, "message":"檔案大小超過 10 MB"})
		
		# 建立檔名 & 組織檔案路徑
		ext = file.filename.split(".")[-1] # 把原檔案的黨名拆開 [-1] 代表最後一個，也就是副檔名
		filename = f"user_{user_id}_{int(time.time())}_.{ext}" # time.time() 目前時間
		file_path = os.path.join(UPLOAD_DIR, filename) 
		# os.path.join 把檔案的路徑設為 UPLOAD_DIR + "/" + filename 根據你的作業系統（Windows 用 \，Linux 用 /）自動補上正確的斜線。

		# 伺服器以「寫入二進位」模式開啟指定路徑的檔案（若不存在則自動建立），並將圖片內容寫入硬碟
		with open(file_path, "wb") as f: # 在open 檔案路徑時，沒有檔案就會自動建立
			f.write(contents) # 寫入資料，文字檔是用 "w"，但圖片是二進位資料（Binary），必須加上 b

		# 更新資料庫路徑
		avatar_url = f"/{UPLOAD_DIR}/{filename}"
		UserModel.update_avatar(conn, user_id, avatar_url)

		return {"ok": True}
	except Error as e:
		conn.rollback()
		print(f"[DB Error] Update User Avatar Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"更新照片錯誤，請稍後再試"})

