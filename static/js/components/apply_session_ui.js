/* 這份檔案用來做/ nav顯示是否已登入的UI / 的功能事件綁定 
    直接傳出去給各 HTML 使用
*/


import { getSession } from "../common/session.js";

export async function applySessionUi(){
    const {loggedIn, user} = await getSession();
    setAuthButtons(loggedIn); // only UI
    return {loggedIn, user} // 提供給各站使用
}

export function setAuthButtons(loggedIn) {
    const loginBtn = document.querySelector("#login-btn");
    const signoutBtn = document.querySelector("#signout-btn");
    if (!loginBtn || !signoutBtn) return;

    if (loggedIn) {
        loginBtn.classList.add("is-hidden");
        signoutBtn.classList.remove("is-hidden");
    } else {
        loginBtn.classList.remove("is-hidden");
        signoutBtn.classList.add("is-hidden");
    }
}