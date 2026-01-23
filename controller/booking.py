"""
Booking 流程：
．點擊右上角預定行程－檢查是否登入－登入－導進入booking頁
．點擊attraction開始預約－檢查是否登入－登入－API包裝資料送回後端insert進入DB－成功後前端轉跳booking頁
．點擊刪除－呼叫API後端進DB刪除資料－成功前端重整booking頁
．以上API都要檢查登入狀態，沒登入就跳出登入畫面

進入booking頁API：
．沒登入不能直接進入booking頁，重導回首頁
．前端API呼叫後端從DB撈資料－build HTML

"""

from fastapi import *
from db.deps import get_conn, get_cur
from controller.user import verify_token
from mysql.connector import Error, IntegrityError, DataError
import json
from models.schemas import *

router = APIRouter()

@router.get("/api/booking")
def get_booking(
    user = Depends(verify_token),
    cur = Depends(get_cur)
    ):
    user_id = int(user["sub"])
    try:
        cur.execute("""
            SELECT 
                b.spot_id AS id,
                b.booking_date AS date,
                b.booking_time AS time,
                b.price AS price,
                s.name AS name,
                s.address AS address,
                s.images AS images
            FROM booking AS b 
            JOIN spot AS s ON b.spot_id = s.id 
            WHERE b.member_id = %s
        """, (user_id,))
        row = cur.fetchone()
        # No booking data
        if not row:
            return {"data": None}
        # 處理image裡的JSON字串
        row_images = row.get("images")
        # 如果沒有就設為空陣列
        if not row_images:
            row["images"] = []
        # 如果有，且型別是str，就用json.load去解析，並取代掉原本row裡的資料
        elif isinstance(row_images, str):
            row["images"] = json.loads(row_images)
        first_img = row["images"][0] if row["images"] else None
        return {
            "data": {
                "attraction": {
                    "id": row["id"],
                    "name": row["name"],
                    "address": row["address"],
                    "image": first_img
                },
                "date": row["date"],
                "time": row["time"],
                "price": row["price"]
                }
            }
    except Error as e:
        print(f"[DB Error] Get Booking Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"取得預定行程時，資料庫錯誤，請稍後再試"})



@router.post("/api/booking")
def add_booking(
    booking_request: bookingRequest,
    user = Depends(verify_token),
    conn = Depends(get_conn),
    ):
    user_id = int(user["sub"])
    attraction_id = booking_request.attraction_id
    date = booking_request.date
    time = booking_request.time
    price = booking_request.price

    cur = conn.cursor(dictionary = True)
    try:
        cur.execute("""
            INSERT INTO booking (member_id, spot_id, booking_date, booking_time, price)
            VALUES (%s, %s, %s, %s, %s) AS new
            ON DUPLICATE KEY UPDATE
                spot_id = new.spot_id,
                booking_date = new.booking_date,
                booking_time = new.booking_time,
                price = new.price;
        """, (user_id, attraction_id, date, time, price))
        conn.commit()
        return {"ok": True}
    except (IntegrityError, DataError) as e:
        conn.rollback()
        print(f"[DB Error] Create Booking Failed: {e}")
        raise HTTPException(status_code=400, detail={"error":True, "message":"預定行程建立失敗，輸入不正確"})        
    except Error as e:
        conn.rollback()
        print(f"[DB Error] Create Booking Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"預定行程建立時，資料庫錯誤，請稍後再試"})
    finally:
        cur.close()
    # IntegrityError：違反資料完整性／約束
    # 典型是 UNIQUE、FOREIGN KEY、NOT NULL、CHECK 之類的約束沒過。

    # DataError：資料型別或範圍不對
    # 典型是 日期格式不合法、數值超出範圍、資料太長、被截斷。

@router.delete("/api/booking")
def delete_booking(
    user = Depends(verify_token),
    conn = Depends(get_conn)
    ):
    cur = conn.cursor(dictionary=True)
    user_id = int(user["sub"])

    try:
        cur.execute("""
            DELETE FROM booking WHERE member_id = %s
        """, (user_id,))
        conn.commit()
        return {"ok": True}
    except Error as e:
        conn.rollback()
        print(f"[DB Error] Delete Booking Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"刪除預定行程失敗，資料庫錯誤，請稍後再試"})
    finally:
        cur.close()