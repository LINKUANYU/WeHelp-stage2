/*  這份檔案用來做
１．檢查使用者session狀態
２．檢查完後回饋給 UI 看要顯示 登入還是登出按鈕
３．檢查 token 簽章
*/

import { request, authHeaders } from "./api.js";

export async function getSession(){
    const token = localStorage.getItem("access_token");
    if (!token){
      return {loggedIn: false, user: null} // 回物件大專案好擴充與維護
    }

    try{
        const res = await fetchCurrentUser();
        const user = res.data;
        return {loggedIn: true, user}
    }catch(e){
        localStorage.removeItem("access_token");
        return {loggedIn: false, user: null};
    }
}

export async function fetchCurrentUser(){
    return request("/api/user/auth", {
        headers: authHeaders()
    })
}

