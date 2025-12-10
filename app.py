from fastapi import *
from fastapi.responses import FileResponse
from deps import get_conn, get_cur
from mysql.connector import Error
from typing import Annotated
app=FastAPI()

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
	except Error as e:
		return {"error": True, "message": e}
	
	# 如果page超過或找不到資料
	if not data:
		return {"data": None}

	# 檢查有沒有下一頁
	if (page + 1) * PAGE_AMOUNT > total:
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
	except Error as e:
		return {"error": True, "message": e}
	
	if not data:
		return {"error": True, "message": "景點編號不正確"}
	return {"data": data}