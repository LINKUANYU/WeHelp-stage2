from fastapi import *
from deps import get_conn, get_cur
from mysql.connector import Error
from routers.auth import verify_token
import time
import os

router = APIRouter()

UPLOAD_DIR = "static/icon/upload"

@router.patch("/api/user/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user = Depends(verify_token),
    conn = Depends(get_conn)
):
    user_id = int(user["sub"])

    # 驗證檔案類型
    if file.content_type not in ["image/jpeg", "image/png"]: 
        # file.content_type 是瀏覽器在傳送檔案時附帶的 MIME Type 資訊，我們不檢查檔案副檔名，而是檢查檔案的實質類型。
        raise HTTPException(status_code=400, detail={"error":True, "message":"檔案類型錯誤"})
    # 驗證大小
    contents = await file.read() # 它會把整張圖片的二進位資料讀進伺服器的記憶體中。len() 算出來會是Bytes大小
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"error":True, "message":"檔案大小超過 10 MB"})
    
    # 建立唯一檔名 & 組路徑
    ext = file.filename.split(".")[-1] # 把原檔案的黨名拆開 [-1] 代表最後一個，也就是副檔名
    filename = f"user_{user_id}_{int(time.time())}_.{ext}" # time.time() 目前時間
    file_path = os.path.join(UPLOAD_DIR, filename) 
    # os.path.join 把檔案的路徑設為 UPLOAD_DIR + "/" + filename 根據你的作業系統（Windows 用 \，Linux 用 /）自動補上正確的斜線。

    # 存到伺服器
    with open(file_path, "wb") as f: # 在open 檔案路徑時，沒有檔案就會自動建立
        f.write(contents) # 寫入資料，文字檔是用 "w"，但圖片是二進位資料（Binary），必須加上 b

    # 更新資料庫路徑
    avatar_url = f"/{UPLOAD_DIR}/{filename}"
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("UPDATE members SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))
        conn.commit()
        return {"ok": True}
    except Error as e:
        conn.rollback()
        print(f"[DB Error] Update User Avatar Failed: {e}")
        raise HTTPException(status_code=500, detail={"error":True, "message":"更新照片錯誤，請稍後再試"})
    finally:
        cur.close()
