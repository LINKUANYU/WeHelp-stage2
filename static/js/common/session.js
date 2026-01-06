/*  這份檔案用來做
１．檢查使用者session狀態
２．檢查完後回饋給 UI 看要顯示 登入還是登出按鈕
３．檢查 token 簽章
*/

import { request, auth_headers } from "./api.js";

export async function get_session(){
    const token = localStorage.getItem("access_token");
    if (!token){
      return {logged_in: false, user: null} // 回物件大專案好擴充與維護
    }

    try{
        const res = await fetch_current_user();
        const user = res.data;
        return {logged_in: true, user}
    }catch(e){
        localStorage.removeItem("access_token");
        return {logged_in: false, user: null};
    }
}

export async function fetch_current_user(){
    return request("/api/user/auth", {
        headers: auth_headers()
    })
}