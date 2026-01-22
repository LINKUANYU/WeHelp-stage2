import mysql.connector
from mysql.connector import pooling, Error
import os
from dotenv import load_dotenv 
from fastapi import Depends
import time

load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")  
DB_NAME = "travel"

dbconfig = {
    "host": DB_HOST,
    "port": DB_PORT,
    "user": DB_USER,
    "password": DB_PASSWORD,
    "database": DB_NAME
}

# 1. 直接在全域定義連線池
try:
    # 這裡的 dbconfig 建議從環境變數讀取
    cnxpool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        **dbconfig
    )
except Error as e:
    # 正式環境邏輯：啟動失敗就印出錯誤並拋出異常
    print(f"CRITICAL: 無法建立連線池: {e}")
    raise SystemExit(1) # 強制停止程式執行

def get_conn():
    conn = None
    max_retries = 5 # 最大重新嘗試次數
    retry_delay = 1 # 重新嘗試間隔
    try:
        for i in range(max_retries):
            try:
                conn = cnxpool.get_connection()
                if conn:
                    break
            except mysql.connector.Error as err: # 連線池已滿的錯誤處理
                print(f"連線池忙碌中，第{i+1}次重試")
                time.sleep(retry_delay)
        # 嘗試跑完回圈還是沒有取得連線
        if not conn:
            raise Exception("無法取得資料庫連線，連線池已滿")
        # 有連線
        yield conn
    finally:
        if conn and conn.is_connected():
            conn.close()

def get_cur(conn = Depends(get_conn)):
    cur = None
    try:
        cur = conn.cursor(dictionary=True)
        yield cur
    finally:
        cur.close()


