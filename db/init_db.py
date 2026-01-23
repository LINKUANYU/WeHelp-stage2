# insert data into db
import json
import os
import mysql.connector
from dotenv import load_dotenv 
from mysql.connector import Error

load_dotenv()
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")  

DB_NAME = "travel"
TABLE_NAME = "spot"

def connect_server():
    return mysql.connector.connect(
        host = DB_HOST,
        port = DB_PORT,
        user = DB_USER,
        password = DB_PASSWORD
    )

def create_db():
    cnx = connect_server()
    cur = cnx.cursor()
    try:
        cur.execute(f'''
        CREATE DATABASE IF NOT EXISTS `{DB_NAME}`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci;
        ''')
        # `...` 是拿來包 欄位名/表名，不能用%s，%s 參數化主要用在 值 (values)，不是用在 資料庫名/表名/欄位名 這種 identifier。
        cnx.commit()
    except Error as e:
        print("建立DB失敗", e)
    finally:
        cur.close()
        cnx.close()

def connect_db():
    return mysql.connector.connect(
        host = DB_HOST,
        port = DB_PORT,
        user = DB_USER,
        password = DB_PASSWORD,
        database = DB_NAME
    )

def create_table():
    cnx = connect_db()
    cur = cnx.cursor()
    try:
        cur.execute(f'''
        CREATE TABLE IF NOT EXISTS `{TABLE_NAME}`(
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NULL,
            description TEXT NULL,
            address TEXT NULL,
            transport TEXT NULL,
            mrt VARCHAR(255) NULL,
            lat DECIMAL(9,6) NULL,
            lng DECIMAL(9,6) NULL,
            images JSON NULL
        )ENGINE=InnoDB;
        ''')
        cnx.commit()
    except Error as e:
        print("建立TABLE失敗", e)
    finally:
        cur.close()
        cnx.close()

    
def insert_data():
    with open ("data/taipei-attractions.json", "r", encoding="utf-8") as f:
        row_data = json.load(f)
    
    data = row_data["result"]["results"]

    cnx = connect_db()
    cur = cnx.cursor()
    sql = f'''
        INSERT INTO `{TABLE_NAME}`(name, category, description, address, transport, mrt, lat, lng, images)
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
    '''

    rows = []
    for d in data:
        name = d.get("name")
        category = d.get("CAT")
        description = d.get("description")
        address = d.get("address")
        transport = d.get("direction")
        mrt = d.get("MRT")
        lat = d.get("latitude") or None
        lng = d.get("longitude") or None
        # 處理img的網址
        file_str = d.get("file") or ""
        imgs = []
        if "https://" in file_str:
            parts = file_str.split("https://")
            for p in parts:
                if p.strip() and p.endswith((".jpg", ".JPG", ".png", ".PNG")):
                    imgs.append("https://" + p.strip())
        # 把 imgs（一個 Python list）轉成JSON 字串, ensure_ascii=False 讓網址/中文等不會被轉成 \uXXXX 這種形式
        if imgs:
            img_json = json.dumps(imgs, ensure_ascii=False)
        else:
            img_json = None
        # 把每筆資料組成turple放入rows
        each_row = (name, category, description,address,transport,mrt,lat,lng,img_json)
        rows.append(each_row)
    
    # 一次寫入DB，executemany：用同一個sql語句，連續餵多筆資料
    try:
        cur.executemany(sql, rows)
        cnx.commit()
    except Error as e:
        cnx.rollback()
        print("匯入資料失敗", e)
    finally:
        cur.close()
        cnx.close()
            

def main():
    create_db()
    print("DB建立成功")
    create_table()
    print("TABLE建立成功")
    insert_data()
    print("資料匯入成功")


main()