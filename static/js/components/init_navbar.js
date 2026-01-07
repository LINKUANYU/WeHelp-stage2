/* 這份檔案用來做 
1.「台北一日遊」事件綁定 
2. 前往booking頁面事件綁定
3. auth modal 的切換事件綁定
*/


export function init_navbar(){
    init_nav_brand();
    init_auth_modal();
}

function init_nav_brand(){
    // Homepage
    const nav_brand = document.querySelector('.nav__brand');
    if (!nav_brand) return;

    nav_brand.addEventListener('click', () => {
        window.location.href = "/";
    });
}

function init_auth_modal(){
    const login_modal = document.querySelector("#login-modal");
    const signup_modal = document.querySelector("#signup-modal");
    const login_btn = document.querySelector("#login-btn");
    const modal_close = document.querySelectorAll(".modal__close");
    const modal_backdrop = document.querySelectorAll(".modal__backdrop");
    const to_signup = document.querySelector(".auth__link--signup");
    const to_login = document.querySelector(".auth__link--login");

    const login_msg = document.querySelector('#login-msg');
    const signup_msg = document.querySelector('#signup-msg');

    if (!login_modal || !signup_modal || !login_btn) return;

    login_btn.addEventListener('click', () => {
        login_modal.classList.toggle("is-hidden");

        // 清空前一筆錯誤訊息
        login_msg.classList.add("is-hidden");
        if (login_msg) login_msg.textContent = "";
    });

    const close_all = () => {
        login_modal.classList.add("is-hidden");
        signup_modal.classList.add("is-hidden");
    };

    modal_close.forEach((m) => {
        m.addEventListener('click', close_all);
    });

    modal_backdrop.forEach((m) => {
        m.addEventListener('click', close_all);
    });

    if (to_signup){
        to_signup.addEventListener("click", () => {
            login_modal.classList.add("is-hidden");
            signup_modal.classList.remove("is-hidden");
            
            // 清空前一筆錯誤訊息
            signup_msg.classList.add("is-hidden");
            if (signup_msg) signup_msg.textContent = "";
        });
    }

    if (to_login){
        to_login.addEventListener("click", () => {
            login_modal.classList.remove("is-hidden");
            signup_modal.classList.add("is-hidden");

            // 清空前一筆錯誤訊息
            login_msg.classList.add("is-hidden");
            if (login_msg) login_msg.textContent = "";
        });
    }

}

