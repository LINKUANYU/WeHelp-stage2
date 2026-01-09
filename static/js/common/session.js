/*  這份檔案用來做檢查使用者session狀態*/

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

