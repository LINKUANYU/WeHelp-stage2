import os
import jwt
import time
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from mysql.connector import Error, IntegrityError, errorcode

# 密碼加密工具
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class UserModel:
    # --- 工具類方法 ---
    @staticmethod
    def hash_password(plain: str) -> str:
        return pwd_context.hash(plain)
    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def create_token(user_id: int, email: str, name: str) -> str:
        payload = {
            "sub": str(user_id),
            "email": email,
            "name": name,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }
        return jwt.encode(payload, os.getenv("KEY"), algorithm=os.getenv("ALGORITHM"))
    
    # --- 資料庫操作方法 ---
    @staticmethod
    def create_user(conn, name, email, password):
        password_hash = UserModel.hash_password(password)
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute(
                "INSERT INTO members(name, email, password_hash) VALUES(%s, %s, %s)", 
                (name, email, password_hash)
            )
            conn.commit()
            return True
        finally:
            cur.close()

    @staticmethod
    def get_user_by_email(cur, email):
        cur.execute("SELECT id, name, email, password_hash FROM members WHERE email = %s", (email,))
        return cur.fetchone()
    
    @staticmethod
    def get_user_by_id(cur, user_id):
        cur.execute("SELECT id, name, email, avatar_url, password_hash FROM members WHERE id=%s", (user_id,))
        return cur.fetchone()
    
    @staticmethod
    def update_user_info(conn, user_id, new_name, new_password_hash=None):
        """
        更新使用者資料。
        如果 new_password_hash 有值，就連密碼一起改；否則只改名字。
        """
        cur = conn.cursor(dictionary=True)
        try:
            if new_password_hash:
                sql = "UPDATE members SET name=%s, password_hash=%s WHERE id=%s"
                params = (new_name, new_password_hash, user_id)
            else:
                sql = "UPDATE members SET name=%s WHERE id=%s"
                params = (new_name, user_id)
            
            cur.execute(sql, params)
            conn.commit()
            return True
        finally:
            cur.close()
    
    @staticmethod
    def update_avatar(conn, user_id, avatar_url):
        cur = conn.cursor(dictionary=True)
        try:
            cur.execute("UPDATE members SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))
            conn.commit()
        finally:
            cur.close()