from fastapi import *
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from routers import attractions, auth
import os 
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error


app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

app.include_router(attractions.router)
app.include_router(auth.router)

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

load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")  
DB_NAME = "travel"

@app.on_event("startup")
def test_db_connection():
	try:
		conn = mysql.connector.connect(
			host = DB_HOST,
			port = DB_PORT,
			user = DB_USER,
			password = DB_PASSWORD,
			database = DB_NAME
		)
		cur = conn.cursor()
		cur.execute("SELECT DATABASE()")
		row = cur.fetchone()
		print("Current DB is ", row[0])
	except Error as e:
		print("Connect fail ", e)
	finally:
		try:
			if cur:
				cur.close()
			if conn:
				conn.close()
		# if cur/conn have not been define as var will cause NameError, just pass it.
		except NameError:
			pass