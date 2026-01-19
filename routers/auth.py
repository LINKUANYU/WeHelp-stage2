from fastapi import *
from deps import get_conn, get_cur
from mysql.connector import Error, IntegrityError, errorcode
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
import os
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas import *

router = APIRouter()

password_context = CryptContext(schemes=["argon2"], deprecated="auto")
def hash_password(plain:str) -> str:
	return password_context.hash(plain)
def verify_password(plain:str, hashed:str) -> bool:
	return password_context.verify(plain, hashed)

load_dotenv()
KEY = os.getenv("KEY")
ALGORITHM = os.getenv("ALGORITHM")
bearer = HTTPBearer(auto_error=False) # 為了自定義進來沒token錯誤顯示

def create_access_token(user_id:int, email:str, name:str) -> str:
	payload = {
		"sub": str(user_id),
		"email": email,
		"name": name,
		"iat": datetime.now(timezone.utc),
		"exp": datetime.now(timezone.utc) + timedelta(days=7)
	}
	return jwt.encode(payload, KEY, algorithm=ALGORITHM)

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
def signup(
	user: Signup,
	conn = Depends(get_conn)
):
	name = user.name
	email = user.email
	password = user.password
	
	if not name or not email or not password:
		raise HTTPException(status_code=400, detail={"error":True, "message":"請輸入完整資訊"})
	
	password_hash = hash_password(password)
	cur = conn.cursor(dictionary=True)

	try:
		
		cur.execute("INSERT INTO members(name, email, password_hash) VALUES(%s, %s, %s)", (name, email, password_hash))
		conn.commit()
		return {"ok":True}
	
	except IntegrityError as e:
		conn.rollback()
		if e.errno == errorcode.ER_DUP_ENTRY:
			raise HTTPException(status_code=400, detail={"error":True, "message":"email已被使用"})
	# 只攔「資料完整性」錯誤（例如 UNIQUE/FK）
	# 這次交易全部撤回，避免半套資料/鎖卡住
	# 判斷是否為「重複鍵」(MySQL 1062)
	# 回給前端 400＋友善訊息

	except Error as e:
		conn.rollback()
		print(f"[DB Error] Create User Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})
	finally:
		cur.close()


@router.put("/api/user/auth")
def login(
	user: Login,
	cur = Depends(get_cur)
):
	
	email = user.email
	password = user.password
	
	try:
		cur.execute("SELECT id, name, email, password_hash FROM members WHERE email = %s", (email,))
		data = cur.fetchone()
		if not data:
			raise HTTPException(status_code=400, detail={"error":True, "message":"帳號或密碼輸入錯誤"})
		if not verify_password(password, data["password_hash"]):
			raise HTTPException(status_code=400, detail={"error":True, "message":"帳號或密碼輸入錯誤"})
		
		token = create_access_token(data["id"], data["email"], data["name"])
		return {"token": token}
	except Error:
		print(f"[DB Error] Select User Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})

# HTTPException
# 用途：當發生業務錯誤或權限不足等情況，需要回 400/401/403/404/409/... 這類錯誤碼時使用。
# 會發生什麼：丟出後，FastAPI 不再執行後續程式碼或路由處理器，直接組出錯誤 JSON。
# 回傳格式（預設）：{"detail": <你給的 detail>}

@router.get("/api/user/auth")
def get_current_user(user = Depends(verify_token)):
	id = user["sub"]
	name = user["name"]
	email = user["email"]
	return {"data": {"id": id, "name": name, "email": email}}