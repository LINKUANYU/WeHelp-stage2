from fastapi import *
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from routers import attractions, auth, booking, order, upload_avatar
from deps import *
from mysql.connector import Error
from schemas import *


app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

app.include_router(attractions.router)
app.include_router(booking.router)
app.include_router(auth.router)
app.include_router(order.router)
app.include_router(upload_avatar.router)

# Static Pages (Never Modify Code in this Block)
@app.get("/", include_in_schema=False)
async def index(request: Request):
	return FileResponse("./static/index.html", media_type="text/html")
@app.get("/attraction/{id}", include_in_schema=False)
async def attraction(request: Request, id: int):
	return FileResponse("./static/attraction.html", media_type="text/html")
@app.get("/booking", include_in_schema=False)
async def booking(request: Request):
	return FileResponse("./static/booking.html", media_type="text/html")
@app.get("/thankyou", include_in_schema=False)
async def thankyou(request: Request):
	return FileResponse("./static/thankyou.html", media_type="text/html")
@app.get("/member", include_in_schema=False)
async def member(request: Request):
	return FileResponse("./static/member.html", media_type="text/html")
@app.get("/purchase", include_in_schema=False)
async def purchase(request: Request):
	return FileResponse("./static/purchase.html", media_type="text/html")

@app.on_event("startup")
def test_db_connection():
	conn = None
	cur = None
	try:
		conn = cnxpool.get_connection()
		cur = conn.cursor()
		cur.execute("SELECT DATABASE()")
		row = cur.fetchone()
		print(f"✅ 連線池測試成功！當前資料庫：{row[0]}")
	except Error as e:
		print(f"❌ DB連線池測試失敗：{e}")
	finally:
		if cur: cur.close()
		if conn: conn.close()

@app.exception_handler(RequestValidationError) # 「當程式發生 RequestValidationError（即 Pydantic 驗證失敗）時，請不要執行預設的報錯，改為執行我下面寫的這個函數。」
async def validation_exception_handler(request: Request, exc: RequestValidationError): # request 規定要寫，exc 代表進來的錯誤
	"""
	攔截所有 pydantice 驗證錯誤，並統一回傳格式
	"""

	error = exc.errors()[0] # 會傳List，抓第一個錯誤顯示就好
	err_msg = error.get("msg")
	err_type = error.get("type")
	print(f"DEBUG: type={err_type}, msg={err_msg}")

	# 判斷是否為email錯誤
	if "email" in err_type or "email address" in err_msg:
		custom_msg = "Email 格式不正確"
	# 判斷是否為長度相關錯誤
	elif any(keyword in err_type for keyword in ["too_short", "less_than", "too_long", "greater_than"]):
		custom_msg = "輸入長度不符合規範"

	# 攔截所有手寫的 valueError，把前面的英文去掉。
	elif "value_error" in err_type:
		custom_msg = err_msg.replace("Value error,", "")
	else:
		custom_msg = "欄位格式不正確，請檢查輸入內容"

	return JSONResponse(
		status_code=400,
		content = {
			"detail": {
				"error": True,
				"message": custom_msg
			}
		}
	)