from fastapi import *
from deps import get_conn, get_cur
from mysql.connector import Error
from typing import Annotated
import json

router = APIRouter()

@router.get("/api/mrts")
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

@router.get("/api/categories")
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
	
@router.get("/api/attractions")
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


@router.get("/api/attraction/{attractionId}")
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