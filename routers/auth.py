from fastapi import *
from deps import get_conn, get_cur
from mysql.connector import Error, IntegrityError, errorcode
from passlib.context import CryptContext
import jwt

router = APIRouter()

password_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(plain:str) -> str:
	return password_context.hash(plain)

def verify_password(plain:str, hashed:str) -> bool:
	return password_context.verify(plain, hashed)





@router.post("/api/signup")
def signup(
	name: str = Form(...),
	email: str = Form(...),
	password: str = Form(...),
	conn = Depends(get_conn)
):
	name = name.strip()
	email = email.strip().lower()
	
	if not name or not email or not password:
		raise HTTPException(status_code=400, detail="請輸入完整資訊")
	
	password_hash = hash_password(password)
	cur = conn.cursor(dictionary=True)

	try:
		
		cur.execute("INSERT INTO members(name, email, password_hash) VALUES(%s, %s, %s)", (name, email, password_hash))
		conn.commit()
		return {"ok":True}
	
	except IntegrityError as e:
		conn.rollback()
		if e.errno == errorcode.ER_DUP_ENTRY:
			raise HTTPException(status_code=400, detail="email 已被使用")
	# 只攔「資料完整性」錯誤（例如 UNIQUE/FK）
	# 這次交易全部撤回，避免半套資料/鎖卡住
	# 判斷是否為「重複鍵」(MySQL 1062)
	# 回給前端 400＋友善訊息

	except Error:
		conn.rollback()
		raise HTTPException(status_code=500, detail="資料庫錯誤，請稍後再試")
	finally:
		cur.close()


@router.post("/api/login")
def login(
	email: str = Form(...),
	password: str = Form(...),
	cur = Depends(get_cur)
):
	email = email.strip().lower()
	if not email or not password:
		raise HTTPException(status_code=400, detail="請輸入完整資訊")
	
	try:
		cur.execute("SELECT name, email, password_hash FROM members WHERE email = %s", (email,))
		data = cur.fetchone()
		if not data:
			raise HTTPException(status_code=401, detail="帳號或密碼輸入錯誤")
		if not verify_password(password, data["password_hash"]):
			raise HTTPException(status_code=401, detail="帳號或密碼輸入錯誤")
		

		return {"ok":True}
	except Error:
		raise HTTPException(status_code=500, detail="資料庫錯誤，請稍後再試")


	
# HTTPException
# 用途：當發生業務錯誤或權限不足等情況，需要回 400/401/403/404/409/... 這類錯誤碼時使用。
# 會發生什麼：丟出後，FastAPI 不再執行後續程式碼或路由處理器，直接組出錯誤 JSON。
# 回傳格式（預設）：{"detail": <你給的 detail>}
