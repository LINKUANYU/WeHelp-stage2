/*  這份檔案用來做
１．檢查使用者session狀態
２．檢查完後回饋給 UI 看要顯示 登入還是登出按鈕
３．檢查 token 簽章
*/

import { request, auth_headers } from "./api.js";

export async function init_session(){
    const token = localStorage.getItem("access_token");
    if (!token) return;
    set_auth_buttons({loading:true});

    try{
        await verify_token();
        set_auth_buttons({logged_in: true, loading: false});
        return;
    }catch(e){
        localStorage.removeItem("access_token");
        set_auth_buttons({logged_in: false, loading: false});
        return;
    }
}


/**
 * loading: 初始載入 session 時避免「登入/登出閃爍」
 * - loading=true：兩顆都先藏
 * - loggedIn=true：顯示登出
 * - loggedIn=false：顯示登入/註冊
 */
export function set_auth_buttons({ logged_in, loading = false }) {
  const login_btn = document.querySelector("#login-btn");
  const signout_btn = document.querySelector("#signout-btn");
  if (!login_btn || !signout_btn) return;

  if (loading) {
    login_btn.classList.add("is-hidden");
    signout_btn.classList.add("is-hidden");
    return;
  }

  if (logged_in) {
    login_btn.classList.add("is-hidden");
    signout_btn.classList.remove("is-hidden");
  } else {
    login_btn.classList.remove("is-hidden");
    signout_btn.classList.add("is-hidden");
  }
}



export async function verify_token(){
    return request("/api/user/auth", {
        headers: auth_headers()
    })
}