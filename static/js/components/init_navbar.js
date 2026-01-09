/* 這份檔案用來做 
1.「台北一日遊」事件綁定 
2. 前往booking頁面事件綁定
3. auth modal 的切換事件綁定
*/


export function initNavbar(){
    initNavBrand();
    initAuthModal();
}

function initNavBrand(){
    // Homepage
    const navBrand = document.querySelector('.nav__brand');
    if (!navBrand) return;

    navBrand.addEventListener('click', () => {
        window.location.href = "/";
    });
}

function initAuthModal(){
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

