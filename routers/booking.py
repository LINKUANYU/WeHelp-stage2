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

