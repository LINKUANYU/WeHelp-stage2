import mysql.connector
import os
from dotenv import load_dotenv 
from fastapi import Depends
from typing import Generator

load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")  
DB_NAME = "travel"

def get_conn() -> Generator:
    conn = mysql.connector.connect(
        host = DB_HOST,
        port = DB_PORT,
        user = DB_USER,
        password = DB_PASSWORD,
        database = DB_NAME
    )
    try:
        yield conn
    finally:
        conn.close()

def get_cur(conn = Depends(get_conn)) -> Generator:
    cur = conn.cursor(dictionary=True)
    try:
        yield cur
    finally:
        cur.close()

