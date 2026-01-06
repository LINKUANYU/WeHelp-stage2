/* 這份檔案用來做 
1.「台北一日遊」事件綁定 
2. 前往booking頁面事件綁定
3. auth modal 的切換事件綁定
*/

import { get_session } from "../common/session.js";

export async function apply_session_ui(){
    const {logged_in} = await get_session();
    set_auth_buttons(logged_in); // only UI
    init_nav_booking();
}


function init_nav_booking(){
    // booking
    const booking_btn = document.querySelector('#booking-btn');
    if (!booking_btn) return;

    booking_btn.addEventListener('click', async () => {
        const {logged_in} = await get_session();  // 點擊時再確認一次登入狀態
        if (!logged_in){
            const login_btn = document.querySelector('#login-btn');
            login_btn.click();
            return
        }else{
            window.location.href = "/booking";
        }
    });
}


export function set_auth_buttons(logged_in) {
    const login_btn = document.querySelector("#login-btn");
    const signout_btn = document.querySelector("#signout-btn");
    if (!login_btn || !signout_btn) return;

    if (logged_in) {
        login_btn.classList.add("is-hidden");
        signout_btn.classList.remove("is-hidden");
    } else {
        login_btn.classList.remove("is-hidden");
        signout_btn.classList.add("is-hidden");
    }
}