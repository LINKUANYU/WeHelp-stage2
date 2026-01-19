from fastapi import *
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from routers import attractions, auth, booking, order
import os
from dotenv import load_dotenv
from deps import *
import mysql.connector
from mysql.connector import Error


app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

app.include_router(attractions.router)
app.include_router(booking.router)
app.include_router(auth.router)
app.include_router(order.router)

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
