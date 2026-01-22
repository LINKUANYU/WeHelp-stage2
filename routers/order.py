"""
order 流程：
收到API -> 產生order_no -> DB建立一筆order mark UNPAID -> 送出tappay request -> 得到回應
回應ok -> DB 建立一筆 payment history -> order mark PAID -> 回給前端 order_no 
回應失敗 -> DB 建立一筆 payment history -> order mark UNPAID -> 回給前端 order_no

TapPay 文件內重要資訊
requests 時必須提供的資料有：
    prime：類似於Token的概念
    amount：金額總數
    details：商品內容
    cardholder_name：持卡人姓名
    cardholder_email：持卡人email
    cardholder_phone：持卡人電話，預設國碼+886
    order_no：您自定義的訂單編號，用於 TapPay 做訂單識別，可重複帶入

respone 重要資訊：
    status：交易代碼，成功的話為0
    msg：錯誤訊息
    rec_trade_id：由 TapPay 伺服器產生的交易字串，將於退款時用到，請妥善保管
    bank_transaction_id：銀行端的訂單編號，強烈建議商戶可在此自訂，但不能與之前的重複；若您沒有自訂則會自動幫您產生一組。但若您沒自訂，當發生421 Gateway 操作逾時（發生機率低），則無法反查該筆交易
    order_no：您自定義的訂單編號，用於 TapPay 做訂單識別，可重複帶入

"""


from fastapi import *
from deps import get_conn, get_cur
from routers.auth import verify_token
from mysql.connector import Error, IntegrityError, DataError
import json
import os
from dotenv import load_dotenv
import time
import secrets
import requests
from schemas import *

router = APIRouter()

load_dotenv()
TAPPAY_PARTNER_KEY = os.getenv("TAPPAY_PARTNER_KEY", "")
TAPPAY_MERCHANT_ID = os.getenv("TAPPAY_MERCHANT_ID", "")
TAPPAY_ENDPOINT = os.getenv("TAPPAY_ENDPOINT", "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime")
TAPPAY_TIMEOUT_SECONDS = int(os.getenv("TAPPAY_TIMEOUT_SECONDS", "30"))

# --- Helper Functions ---
def gen_order_no(prefix: str = "TP") -> str:
    # 例：TP20260113153012-8F3A1C
    ts = time.strftime("%y%m%d%H%M%S" , time.localtime()) # 把現在時間格式化成字串
    rnd = secrets.token_hex(3).upper() # 產生短且隨機的字串
    return f"{prefix}{ts}-{rnd}" # 三者組合成一個隨機字串

def gen_bank_transaction_id() -> str:
    # TapPay 文件建議自訂 bank_transaction_id，避免 timeout 後難以反查，建議20碼以內
    ts = time.strftime("%y%m%d%H%M%S" , time.localtime()) # 把現在時間格式化成字串
    rnd = secrets.token_hex(3).upper() # 產生短且隨機的字串
    return f"{ts}{rnd}" # 組合成一個隨機字串


def call_tappay_pay_by_prime(
    prime: str,
    amount: int,
    details: str,
    cardholder_name: str,
    cardholder_email: str,
    cardholder_phone: str,
    order_no: str
) -> dict:
    
    if not TAPPAY_PARTNER_KEY or not TAPPAY_MERCHANT_ID:
        # 當一個錯誤發生，且這個錯誤不屬於其他任何特定的類別時，就用 RuntimeError。也有代表「執行環境」有錯誤
        print("[CRITICAL] Missing TapPay config: TAPPAY_PARTNER_KEY / TAPPAY_MERCHANT_ID")
        raise RuntimeError("Missing TapPay config: TAPPAY_PARTNER_KEY / TAPPAY_MERCHANT_ID")
    
    bank_transaction_id = gen_bank_transaction_id()

    headers = {
        "Content-Type": "application/json",
        "x-api-key": TAPPAY_PARTNER_KEY
    }

    body = {
        "prime": prime,
        "partner_key": TAPPAY_PARTNER_KEY,
        "merchant_id": TAPPAY_MERCHANT_ID,
        "amount": amount,
        "details": details,
        "order_number": order_no,
        "bank_transaction_id": bank_transaction_id,
        "cardholder": {
            "phone_number": cardholder_phone,
            "name": cardholder_name,
            "email": cardholder_email
        },
        "remember": False
    }
    # 送出request 給TapPay
    try:
        r = requests.post(
            TAPPAY_ENDPOINT,
            headers = headers,
            data = json.dumps(body),
            timeout = TAPPAY_TIMEOUT_SECONDS
        )
        # TapPay 通常會回 JSON；若非 JSON 也讓它丟例外，交給上層記錄 UNKNOWN
        return r.json()
    except requests.exceptions.RequestException as e:
        # 這裡捕捉的是連線失敗，不是支付失敗，上面那一串是 requests 套件裡所有連線錯誤
        print(f"[TapPay Error] Connection Error {e}")
        # 預防訊息太長無法存入DB
        full_err_msg = f"Connection Error {str(e)}"
        short_err_msg = full_err_msg[:250]

        return {"status": -1, "msg": short_err_msg}


# --- API Endpoint ---
@router.post("/api/orders")
def create_order(
    payload: OrderRequest,
    user = Depends(verify_token),
    conn = Depends(get_conn)
):
    user_id = int(user["sub"])
    order_no = gen_order_no()

    # 拿出前端傳來的參數
    prime = payload.prime
    order_detail = payload.order
    amount = order_detail.price
    contact = order_detail.contact
    cardholder_name = contact.name
    cardholder_email = contact.email
    cardholder_phone = contact.phone
    trip = order_detail.trip
    trip_date = trip.date
    trip_time = trip.time
    attraction = trip.attraction
    attraction_id = attraction.id
    attraction_name = attraction.name
    attraction_address = attraction.address
    attraction_image = attraction.image
    
    # 檢查 contact 與 DB 是否相同
    user_email = user["email"]
    user_name = user["name"]
    if user_name != cardholder_name or user_email != cardholder_email:
        raise HTTPException(status_code=400, detail={"error":True, "message":"聯絡資訊與登入帳號不符"})

    # 建立 order
    try:
        cur = conn.cursor(dictionary=True)
        conn.start_transaction() # 等於在sql START TRANSACTION; 會把你接下來做的多個 SQL 操作「綁成一組」：
        
        cur.execute("""
        INSERT INTO orders (order_no, member_id, status, amount_total, 
                    spot_id, spot_name, spot_address, spot_image,
                    booking_date, booking_time, price,
                    contact_name, contact_email, contact_phone,
                    created_at)
        VALUES (%s, %s, "UNPAID", %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (order_no, user_id, amount, 
              attraction_id, attraction_name, attraction_address, attraction_image,
              trip_date, trip_time, amount,
              cardholder_name, cardholder_email, cardholder_phone
              ))

        order_id = cur.lastrowid # 取得剛剛建立那筆資料的id
        conn.commit()

    except (IntegrityError, DataError) as e:
        conn.rollback()
        print(f"[DB Error] Create Order Failed: {e}")
        raise HTTPException(status_code=400, detail={"error":True, "message":"訂單建立失敗，輸入不正確"})
    except Error as e:
        conn.rollback()
        print(f"[DB Error] Create Order Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"訂單建立時，資料庫錯誤，請稍後再試"})
    finally:
        cur.close()
        
    # sent Request TapPay
    tappay_res = call_tappay_pay_by_prime(
        prime=prime,
        amount=amount,
        details=attraction_name,
        order_no=order_no,
        cardholder_name=cardholder_name,
        cardholder_email=cardholder_email,
        cardholder_phone=cardholder_phone
    )
    # Respone from TapPay
    tappay_status = tappay_res.get("status")
    tappay_msg = tappay_res.get("msg")
    tappay_rec_trade_id = tappay_res.get("rec_trade_id")
    tappay_bank_transaction_id = tappay_res.get("bank_transaction_id")
    tappay_amount = tappay_res.get("amount")

    tappay_success = (tappay_status == 0)

    # 建立 payment
    try:
        # 不論付款成功或失敗都建立 payment
        cur = conn.cursor(dictionary=True)
        conn.start_transaction() # 等於在sql START TRANSACTION; 會把你接下來做的多個 SQL 操作「綁成一組」：

        payment_status = "SUCCESS" if tappay_success else "FAILED"

        payment_amount = 0 if not tappay_success else tappay_amount

        cur.execute("""
            INSERT INTO payment (
                order_id, status, amount, created_at,
                tappay_status, tappay_msg, tappay_rec_trade_id, tappay_bank_transaction_id
            ) VALUES (%s, %s, %s, NOW(), %s, %s, %s, %s)
        """, (order_id, payment_status, payment_amount, 
            tappay_status, tappay_msg, tappay_rec_trade_id, tappay_bank_transaction_id))
        # 如果付款成功，更新order Table
        if tappay_success:
            cur.execute("""
                UPDATE orders SET status = "PAID", updated_at = NOW() 
                WHERE order_no = %s
            """, (order_no,))

        conn.commit()
    except Error as e:
        # 這裏錯誤代表「可能已經扣錢了，但DB沒更新』
        conn.rollback()
        print(f"[CRITICAL PAYMAENT] DB error:{e} | Order:{order_no} | PayStatus:{tappay_status}")
        raise HTTPException(status_code=500 ,detail={"error": True, "message": "Payment 建立失敗，已走完付款流程（可能已付款成功）"})
    finally:
        cur.close()

    # 清空原本購物車內資訊
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            DELETE FROM booking WHERE member_id = %s
        """, (user_id,))
        conn.commit()
    except Error as e:
        conn.rollback()
        print(f"[DB Error] Delete Booking Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"刪除預定行程失敗，資料庫錯誤，請稍後再試"})
    finally:
        cur.close()

    # 回給前端結果
    if tappay_success:
        return {
            "data": {
                "order_no": order_no,
                "payment": {
                    "status": tappay_status,
                    "msg": "Payment success"
                }
            }
        }
    else:
        return {
            "data": {
                "order_no": order_no,
                "payment": {
                    "status": tappay_status,
                    "msg": f"Payment failed: {tappay_msg}"
                }
            }
        }
    

@router.get("/api/order/{orderNumber}")
def get_order(
    orderNumber: str,
    user = Depends(verify_token),
    cur = Depends(get_cur)
):
    user_id = int(user["sub"])

    try:
        cur.execute("SELECT * FROM orders WHERE order_no = %s", (orderNumber,))
        row = cur.fetchone()
    except Error as e:
        print(f"DB {e} at 尋找訂單號碼")
        raise HTTPException(status_code=500, detail={"error":True, "message":"資料庫錯誤，請稍後再試"})
    # 沒有訂單資料
    if not row:
        return {"data": None}
    # 不能查別人的訂單
    if row["member_id"] != user_id:
        raise HTTPException(status_code=403, detail={"error":True, "message":"沒有訪問權限"})
    
    return{
        "data": {
            "number": orderNumber,
            "price": int(row["price"]),
            "trip": {
                "attraction": {
                    "id": int(row["spot_id"]),
                    "name": row["spot_name"],
                    "address": row["spot_address"],
                    "image": row["spot_image"]
                },
                "date": row["booking_date"],
                "time": row["booking_time"]
            },
            "contact": {
                "name": row["contact_name"],
                "email": row["contact_email"],
                "phone": row["contact_phone"]
            },
            "status": row["status"]
        }
    }

@router.get("/api/order-history")
def get_order_history(
    user = Depends(verify_token),
    cur = Depends(get_cur)
):
    user_id = int(user["sub"])
    print(user_id)
    try:
        cur.execute("""
        SELECT order_no, status, spot_name, spot_address, spot_image,
                    booking_date, booking_time, price
        FROM orders WHERE member_id = %s
        """, (user_id,))
        
        rows = cur.fetchall()
    
        if not rows:
            return {"data": False}

        return {"data": rows}
    except Error as e:
        print(f"[DB Error] Search Orders Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"尋找歷史訂單，資料庫錯誤，請稍後再試"})
    