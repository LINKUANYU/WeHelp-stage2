/* 這份檔案用來做 
1.「台北一日遊」事件綁定 
2. 前往booking頁面事件綁定
3. auth modal 的切換事件綁定
*/

import { getSession } from "../common/session.js";

export async function applySessionUi(){
    const {loggedIn, user} = await getSession();
    setAuthButtons(loggedIn); // only UI
    initNavBooking();
    return {loggedIn, user} // 提供給各站使用
}


function initNavBooking(){
    // booking
    const toBookingBtn = document.querySelector('#to-booking-btn');
    if (!toBookingBtn) return;

    toBookingBtn.addEventListener('click', async () => {
        const {loggedIn} = await getSession();  // 點擊時再確認一次登入狀態
        if (!loggedIn){
            const loginBtn = document.querySelector('#login-btn');
            loginBtn.click();
            return;
        }else{
            window.location.href = "/booking";
        }
    });
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