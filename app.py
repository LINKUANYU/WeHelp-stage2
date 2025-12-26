from fastapi import *
from fastapi.responses import FileResponse
from deps import get_conn, get_cur
from mysql.connector import Error, IntegrityError, errorcode
from typing import Annotated
from fastapi.staticfiles import StaticFiles
import json
app=FastAPI()

app.mount("/static", StaticFiles(directory="static"))

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


@app.post("/api/login")
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
		# hash check function 先不寫
		data = cur.fetchone()
		if not data:
			raise HTTPException(status_code=401, detail="帳號或密碼輸入錯誤")
		if data["password_hash"] != password:
			raise HTTPException(status_code=401, detail="帳號或密碼輸入錯誤")
		return {"ok":True, "data":data}
	except Error:
		raise HTTPException(status_code=500, detail="資料庫錯誤，請稍後再試")

@app.post("/api/signup")
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
	
	# hash 先不寫
	cur = conn.cursor(dictionary=True)
	try:
		cur.execute("INSERT INTO members(name, email, password_hash) VALUES(%s, %s, %s)", (name, email, password))
		conn.commit()
		return {"ok":True, "msg":"註冊成功"}
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
	
# HTTPException
# 用途：當發生業務錯誤或權限不足等情況，需要回 400/401/403/404/409/... 這類錯誤碼時使用。
# 會發生什麼：丟出後，FastAPI 不再執行後續程式碼或路由處理器，直接組出錯誤 JSON。
# 回傳格式（預設）：{"detail": <你給的 detail>}

# API
@app.get("/api/mrts")
def mrt(cur = Depends(get_cur)):
	try:
		cur.execute("""
			SELECT mrt, COUNT(*) AS cnt FROM spot
			WHERE mrt IS NOT NULL AND mrt <> ''
			GROUP BY mrt ORDER BY cnt DESC
		""")
		# 把其中一個沒有捷運站的去掉

		data = cur.fetchall()
		result = []
		for d in data:
			result.append(d["mrt"])
		return {"data": result}
	except Error as e:
		return {"error": True, "message": e}

@app.get("/api/categories")
def categoies(cur = Depends(get_cur)):
	try:
		cur.execute("SELECT DISTINCT category FROM spot")
		data = cur.fetchall()
		result = []
		for d in data:
			result.append(d["category"])
		return {"data": result}
	except Error as e:
		return {"error": True, "message": e}
	
@app.get("/api/attractions")
def attractions(
	page: Annotated[int, Query(ge=0)],
	category: Annotated[str | None, Query()] = None,
	keyword: Annotated [str | None, Query()] = None,
	cur = Depends(get_cur)
	):
	PAGE_AMOUNT = 8
	offset = page * PAGE_AMOUNT
	# 兩個sql，一個搜尋，另一個抓搜尋結果總數
	sql = '''SELECT * FROM spot'''
	count_sql = '''SELECT COUNT(*) AS cnt FROM spot'''
	# 篩選條件及放入參數
	condition = []
	params = []

	# 共同搜尋條件
	if category:
		condition.append("category = %s")
		params.append(category)
	if keyword:
		condition.append("(mrt = %s OR name LIKE %s)")
		params.append(keyword)
		params.append(f'%{keyword}%')
	if condition:
		sql = sql + " WHERE " + " AND ".join(condition)
		count_sql = count_sql + " WHERE " + " AND ".join(condition)

	# 先抓結果總數，因為後面要補條件LIMIT, OFFSET，不適用於COUNT(*)
	try:
		cur.execute(count_sql, params)
		total_data = cur.fetchone()
		total = total_data["cnt"]
		# 如果找不到資料，直接return
		if total == 0:
			return {"data": None}
	except Error as e:
		return {"error": True, "message": e}

	# 搜尋結果補上每頁顯示的條件
	sql = sql + " ORDER BY id LIMIT %s OFFSET %s"
	params.append(PAGE_AMOUNT)
	params.append(offset)

	try:
		cur.execute(sql, params)
		data = cur.fetchall()
		# 處理image裡的JSON字串
		for row in data:
			row_image = row.get("images")
			# 如果沒有就設為空陣列
			if not row_image:
				row["images"] = []
			# 如果有，且型別是str，就用json.load去解析，並取代掉原本data裡的資料
			elif isinstance(row_image, str):
				row["images"] = json.loads(row_image)
	except Error as e:
		return {"error": True, "message": e}
	
	# 如果page超過或找不到資料
	if not data:
		return {"data": None}

	# 檢查有沒有下一頁
	if (page + 1) * PAGE_AMOUNT >= total:
		next_page = None
	else:
		next_page = page + 1 
	
	return {"nextPage": next_page, "data": data}


@app.get("/api/attraction/{attractionId}")
def attraction_id(
    attractionId: Annotated[int, Path()],
	cur = Depends(get_cur)
):
	sql = '''
		SELECT * FROM spot WHERE id = %s
	'''
	try:
		cur.execute(sql, (attractionId,))
		data = cur.fetchone()
		# 處理image裡的JSON字串
		data_image = data.get("images")
		# 如果沒有就設為空陣列
		if not data_image:
			data["images"] = []
		# 如果有，且型別是str，就用json.load去解析，並取代掉原本data裡的資料
		elif isinstance(data_image, str):
			data["images"] = json.loads(data_image)
	except Error as e:
		return {"error": True, "message": e}
	
	if not data:
		return {"error": True, "message": "景點編號不正確"}
	return {"data": data}