from pydantic import BaseModel, EmailStr, Field, field_validator, StringConstraints
import re
from typing import Annotated

# 把所有 str 都去掉空白 & 加上必填(空字串不行)
Cleanstr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class Signup(BaseModel):
    # 姓名：必填、長度2~20
    name: Cleanstr = Field(..., min_length=2, max_length=30)
    # Email：使用 EmailStr 自動驗證(install email-validator)
    email: EmailStr
    # 密碼：必填、自定義限制
    password: Cleanstr = Field(..., min_length=8)
    
    @field_validator('email')
    @classmethod
    def email_tolower(cls, v):
        return v.lower() # Emailstr 已經自己做過strip()

    @field_validator('password') 
    @classmethod 
    def password_strength(cls, v: str) -> str: # 檢查邏輯的內容
        # 在 Python 中，re 是內建處理 正規表達式 (Regular Expression) 的模組。它強大的地方在於可以用一小串「符號密碼」來描述極其複雜的文字規則。
        # r (代表 raw string)，這是為了告訴 Python：「請把裡面的斜線 \ 當作普通字元，不要把它當作換行符號之類的特殊轉義。
        # 意思是在字串中尋找任何一個從 A 到 Z 的大寫字母。
        if not re.search(r"[A-Z]", v): 
            raise ValueError('密碼必須至少包含一個大寫字母')
        
        # \ 反斜線：在正規表達式中是「轉義符」，用來代表特殊分類
        if not re.search(r"\d", v):
            raise ValueError('密碼必須至少包含一個數字')
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('密碼必須至少包含一個特殊符號')
        
        return v
        
class Login(BaseModel):
    email: EmailStr
    password: Cleanstr

    @field_validator('email')
    @classmethod
    def clean_name(cls, v):
        return v.lower()