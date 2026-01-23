from fastapi import *
from db.deps import get_conn, get_cur
from mysql.connector import Error
from typing import Annotated
import json
from models.attraction_model import *

router = APIRouter()

@router.get("/api/mrts")
def get_mrt(cur = Depends(get_cur)):
	try:
		result = AttractionModel.get_all_mrt(cur)
		return {"data": result}
	except Error as e:
		print(f"[DB Error] Get Mrt Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})

@router.get("/api/categories")
def categoies(cur = Depends(get_cur)):
	try:
		result = AttractionModel.get_all_categories(cur)
		return {"data": result}
	except Error as e:
		print(f"[DB Error] Get Categories Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})
	
@router.get("/api/attractions")
def attractions(
	page: Annotated[int, Query(ge=0)],
	category: Annotated[str | None, Query()] = None,
	keyword: Annotated [str | None, Query()] = None,
	cur = Depends(get_cur)
	):
	try:
		data, total = AttractionModel.get_attraction(cur, page, category, keyword)
		if not data:
			return {"data": None}
		
		# 處理「下一頁」邏輯
		PAGE_AMOUNT = 8
		# 檢查有沒有下一頁
		if (page + 1) * PAGE_AMOUNT >= total:
			next_page = None
		else:
			next_page = page + 1 
		
		return {"nextPage": next_page, "data": data}

	except Error as e:
		print(f"[DB Error] Get Attraciotns Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})
	

@router.get("/api/attraction/{attractionId}")
def attraction_id(
    attractionId: Annotated[int, Path()],
	cur = Depends(get_cur)
):
	try:
		data = AttractionModel.get_by_id(cur, attractionId)
		if not data:
			return {"error": True, "message": "景點編號不正確"}

		return {"data": data}
	except Error as e:
		print(f"[DB Error] Get Spot Failed: {e}")
		raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})
	
