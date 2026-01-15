/* 這份檔案用來做/ 註冊／登入／登出/ 註冊登入對話框顯示/ 的功能事件綁定 */

import { getErrorMsg, request } from "../common/api.js";

export function bindNavAuth(){
    bindLoginForm();
    bindSignupForm();
    bindSignoutBtn();
    bindAuthModal();
}

function bindLoginForm(){
    const loginForm = document.querySelector('#login-form');
    if (!loginForm) return;

    const loginModal = document.querySelector('#login-modal')
    const loginMsg = document.querySelector('#login-msg');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const loginEmail = document.querySelector('#login-email').value.trim();
        const loginPassword = document.querySelector('#login-password').value;

        if (!loginEmail || !loginPassword){
            if (loginMsg){
                loginMsg.classList.remove("is-hidden");
                loginMsg.textContent = "請輸入完整資訊";
            }
            return;
        }

        const fd = new FormData(e.currentTarget);

        try{
            const res = await request("/api/user/auth", {
                method: "PUT",
                body: fd
            });
            const token = res.token;
            if (token) localStorage.setItem("access_token", token);
            if (loginModal) loginModal.classList.add("is-hidden");
            window.location.reload()
        }catch(e){
            if (loginMsg){
                loginMsg.classList.remove("is-hidden");
                loginMsg.textContent = getErrorMsg(e);
            }
        }
    });
}

function bindSignupForm(){
    const signupForm = document.querySelector('#signup-form');
    if (!signupForm) return;

    const signupModal = document.querySelector('#signup-modal');
    const signupMsg = document.querySelector('#signup-msg');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const signupName = document.querySelector("#signup-name").value.trim();
        const signupEmail = document.querySelector("#signup-email").value.trim();
        const signupPassword = document.querySelector("#signup-password").value;

        if (!signupEmail || !signupPassword || !signupName) {
            if (signupMsg) {
                signupMsg.classList.remove("is-hidden");
                signupMsg.textContent = "請輸入完整資訊";
            }
            return;
        }

        const fd = new FormData(e.currentTarget);

        try{
            await request("/api/user", {
                method: "POST",
                body: fd
            });
            if (signupModal) signupModal.classList.add("is-hidden");
        }catch(e){
            if (signupMsg){
                signupMsg.classList.remove("is-hidden");
                signupMsg.textContent = getErrorMsg(e);
            }
        }
    });
}

function bindSignoutBtn(){
    const signoutBtn = document.querySelector('#signout-btn');
    if (!signoutBtn) return;

    signoutBtn.addEventListener('click', () => {
        localStorage.removeItem("access_token");
        window.location.reload();
    });
}

function bindAuthModal(){
    const loginModal = document.querySelector("#login-modal");
    const signupModal = document.querySelector("#signup-modal");
    const loginBtn = document.querySelector("#login-btn");
    const modalClose = document.querySelectorAll(".modal__close");
    const modalBackdrop = document.querySelectorAll(".modal__backdrop");
    const toSignup = document.querySelector(".auth__link--signup");
    const toLogin = document.querySelector(".auth__link--login");

    const loginMsg = document.querySelector('#login-msg');
    const signupMsg = document.querySelector('#signup-msg');

    if (!loginModal || !signupModal || !loginBtn) return;

    loginBtn.addEventListener('click', () => {
        loginModal.classList.toggle("is-hidden");

        // 清空前一筆錯誤訊息
        loginMsg.classList.add("is-hidden");
        if (loginMsg) loginMsg.textContent = "";
    });

    const closeAll = () => {
        loginModal.classList.add("is-hidden");
        signupModal.classList.add("is-hidden");
    };

    modalClose.forEach((m) => {
        m.addEventListener('click', closeAll);
    });

    modalBackdrop.forEach((m) => {
        m.addEventListener('click', closeAll);
    });

    if (toSignup){
        toSignup.addEventListener("click", () => {
            loginModal.classList.add("is-hidden");
            signupModal.classList.remove("is-hidden");
            
            // 清空前一筆錯誤訊息
            signupMsg.classList.add("is-hidden");
            if (signupMsg) signupMsg.textContent = "";
        });
    }

    if (toLogin){
        toLogin.addEventListener("click", () => {
            loginModal.classList.remove("is-hidden");
            signupModal.classList.add("is-hidden");

            // 清空前一筆錯誤訊息
            loginMsg.classList.add("is-hidden");
            if (loginMsg) loginMsg.textContent = "";
        });
    }

}