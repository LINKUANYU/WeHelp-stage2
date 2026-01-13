"""
order 流程：
收到API -> 產生order_no -> DB建立一筆order mark UNPAID -> 送出tappay request -> 得到回應
回應ok -> DB 建立一筆 payment history -> order mark PAID -> 回給前端 order_no 
回應失敗 -> DB 建立一筆 payment history -> order mark UNPAID -> 回給前端 order_no

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

router = APIRouter()

load_dotenv()
TAPPAY_PARTNER_KEY = os.getenv("TAPPAY_PARTNER_KEY", "")
TAPPAY_MERCHANT_ID = os.getenv("TAPPAY_MERCHANT_ID", "")
TAPPAY_ENDPOINT = os.getenv("TAPPAY_ENDPOINT", "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime")
TAPPAY_TIMEOUT_SECONDS = int(os.getenv("TAPPAY_TIMEOUT_SECONDS", "30"))

def gen_order_no(prefix: str = "TP") -> str:
    # 例：TP20260113153012-8F3A1C
    ts = time.strftime("%Y%m%d%H%M%S" , time.localtime()) # 把現在時間格式化成字串
    rnd = secrets.token_hex(3).upper() # 產生短且隨機的字串
    return f"{prefix}{ts}-{rnd}" # 三者組合成一個隨機字串

def gen_bank_transaction_id(order_no: str) -> str:
    # TapPay 文件建議自訂 bank_transaction_id，避免 timeout 後難以反查
    # 做到全站唯一即可
    return f"BTID-{order_no}"


def call_tappay_pay_by_prime(
    prime: str,
    amount: int,
    cardholder_name: str,
    cardholder_email: str,
    cardholder_phone: str,
    order_no: str
) -> dict:
    
    if not TAPPAY_PARTNER_KEY or not TAPPAY_MERCHANT_ID:
        raise RuntimeError("Missing TapPay config: TAPPAY_PARTNER_KEY / TAPPAY_MERCHANT_ID")
    
    bank_transaction_id = gen_bank_transaction_id(order_no)

    headers = {
        "Content-Type": "application/json",
        "x-api-key": TAPPAY_PARTNER_KEY
    }

    body = {
        "prime": prime,
        "partner_key": TAPPAY_PARTNER_KEY,
        "merchant_id": TAPPAY_MERCHANT_ID,
        "amount": amount,
        "order_number": order_no,
        "bank_transcation_id": bank_transaction_id,
        "cardholder": {
            "phone_number": cardholder_phone,
            "name": cardholder_name,
            "email": cardholder_email
        },
        "remeber": False
    }

    r = requests.post(
        TAPPAY_ENDPOINT,
        headers = headers,
        data = json.dump(body),
        timeout = TAPPAY_TIMEOUT_SECONDS
    )
    
    # TapPay 通常會回 JSON；若非 JSON 也讓它丟例外，交給上層記錄 UNKNOWN
    return r.json()


@router.post("/api/orders")
def create_order(
    payload: dict = Body(...),
    user = Depends(verify_token),
    conn = Depends(get_conn)
):
    prime = payload["prime"]
    amount = payload["order"]["price"]
    attraction_id = payload["order"]["trip"]["attraction"]["id"]
    attraction_name = payload["order"]["trip"]["attraction"]["name"]
    attraction_address = payload["order"]["trip"]["attraction"]["address"]
    attraction_image = payload["order"]["trip"]["attraction"]["image"]
    cardholder_name = payload["order"]["contact"]["name"]
    cardholder_email = payload["order"]["contact"]["email"]
    cardholder_phone = payload["order"]["contact"]["phone"]

    cur = conn.cursor()
    # DB 建立 order
    cur.execute("INSERT INTO ")
    