/* 這份檔案用來做/ 預定行程 / 的功能事件綁定 */

import { getSession } from "../common/session.js";

export function bindNavBooking(){
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