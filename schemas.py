from pydantic import BaseModel, EmailStr, Field, field_validator, StringConstraints
import re
from typing import Annotated, Optional
from datetime import date, datetime

# 把所有 str 都去掉頭尾空白 & 加上必填(空字串不行)
Cleanstr = Annotated[str, StringConstraints(strip_whitespace=True)]

# --- auth.py ---
class Signup(BaseModel):
    # 姓名：必填、長度2~20
    name: Cleanstr = Field(..., min_length=2, max_length=30)
    # Email：使用 EmailStr 自動驗證(install email-validator)
    email: EmailStr
    # 密碼：必填、自定義限制
    password: str = Field(..., min_length=8)
    
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
    password: str

    @field_validator('email')
    @classmethod
    def clean_name(cls, v):
        return v.lower()
    

class UpdateUser(BaseModel): 
    name: Cleanstr = Field(..., min_length=2, max_length=30) 
    old_password: Optional[str] = None # 不一定要改密碼
    new_password: Optional[str] = None # 不一定要改密碼

    @field_validator('new_password')
    @classmethod
    def password_strngth(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        if len(v) < 8:
            raise ValueError('密碼長度至少需 8 位')
        if not re.search(r"[A-Z]", v):
            raise ValueError('密碼必須至少包含一個大寫字母')
        if not re.search(r"\d", v):
            raise ValueError('密碼必須至少包含一個數字')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('密碼必須至少包含一個特殊符號')
        
        return v

    
# --- booking.py ---
class bookingRequest(BaseModel):
    attraction_id: int
    date: Cleanstr = Field(..., min_length=1)
    time: Cleanstr = Field(..., min_length=1)
    price: int = Field(..., gt=0) # 價格需大於0

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str):
        try:
            # strptime 是將str -> object 並照的%Y-%m-%d的模板
            # 轉成物件後才可以用各種方法，date()是把時、分、秒捨去，剩年、月、日
            booking_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("日期格式錯誤，應為 YYYY-MM-DD")
        
        if booking_date < date.today():
            raise ValueError("日期不能為過去的時間")
        return v


# --- order.py ---
class Attraction(BaseModel):
    id: int
    name: str
    address: str
    image: str

class Contact(BaseModel):
    name: Cleanstr = Field(..., min_length=2, max_length=30)
    email: EmailStr
    phone: Cleanstr

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not re.match(r'^09\d{8}$', v): # ^ 開頭匹配。\d{8} 要八個數字
            raise ValueError('手機號碼格式錯誤')
        return v
        # 如果沒有 ^: "我是0912345678" 會判定為成功（因為中間含有 09...）。
        # 如果沒有 $: "09123456789999" 會判定為成功（因為前段符合）。
        # 加上 ^ 和 $: 唯有「剛好 10 位數且 09 開頭」 的字串才會通過。

class Trip(BaseModel):
    attraction: Attraction # 這裡引用了上面的 Attraction
    date: str
    time: str
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str):
        try:
            # strptime 是將str -> object 並照的%Y-%m-%d的模板
            # 轉成物件後才可以用各種方法，date()是把時、分、秒捨去，剩年、月、日
            booking_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("日期格式錯誤，應為 YYYY-MM-DD")
        
        if booking_date < date.today():
            raise ValueError("日期不能為過去的時間")
        return v

class OrderDetail(BaseModel):
    price: int = Field(..., gt=0) # 甚至可以加驗證：必須大於 0
    trip: Trip       # 引用 Trip
    contact: Contact # 引用 Contact

# 最外層：接收的 Payload
class OrderRequest(BaseModel):
    prime: str
    order: OrderDetail