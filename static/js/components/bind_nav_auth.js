/* 這份檔案用來做/ 註冊／登入／登出/ 註冊登入對話框顯示/ 的功能事件綁定 */

import { getErrorMsg, request } from "../common/api.js";

export function bindNavAuth(){
    bindLoginBtn();
    bindSignupBtn();
    bindSignoutBtn();
    bindAuthModal();
    bindSignupInput();
}

function bindLoginBtn(){
    const loginBtn = document.querySelector('#submit-login-btn');
    if (!loginBtn) return;

    const loginModal = document.querySelector('#login-modal')
    const loginMsg = document.querySelector('#login-msg');

    loginBtn.addEventListener('click', async (e) => {
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

        const body = {
            "email": loginEmail,
            "password": loginPassword
        }

        try{
            const res = await request("/api/user/auth", {
                method: "PUT",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(body)
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

function bindSignupBtn(){
    const signupBtn = document.querySelector('#submit-signup-btn');
    if (!signupBtn) return;

    const signupMsg = document.querySelector('#signup-msg');

    signupBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const signupName = document.querySelector("#signup-name").value.trim();
        const signupEmail = document.querySelector("#signup-email").value.trim();
        const signupPassword = document.querySelector("#signup-password").value;
        // 檢查輸入值不可為空
        if (!signupEmail || !signupPassword || !signupName) {
            if (signupMsg) {
                signupMsg.classList.remove("is-hidden");
                signupMsg.textContent = "請輸入完整資訊";
            }
            return;
        }
        // 檢查註冊密碼條件
        const invalidRules = document.querySelectorAll('.validation-list .invalid');
        if (invalidRules.length > 0) {
            if (signupMsg) {
                signupMsg.classList.remove("is-hidden");
                signupMsg.textContent = "請確保密碼符合所有強度要求";
            }
            return;
        }

        const body = {
            "name": signupName,
            "email": signupEmail,
            "password": signupPassword
        }

        try{
            const res = await request("/api/user", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(body)
            });
            if (res.ok){
                signupMsg.classList.remove("is-hidden");
                signupMsg.textContent = "註冊成功，請重新登入";
            }
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
    const toSignup = document.querySelector("#to-signup");
    const toLogin = document.querySelector("#to-login");

    const loginEmailInput = document.querySelector('#login-email');
    const loginPasswordInput = document.querySelector('#login-password');
    const signupNameInput = document.querySelector('#signup-name');
    const signupEmailInput = document.querySelector('#signup-email');
    const signupPasswordInput = document.querySelector('#signup-password');
    const loginMsg = document.querySelector('#login-msg');
    const signupMsg = document.querySelector('#signup-msg');

    const validationList = document.querySelector('.validation-list');
    const ruleLength = document.querySelector('#rule-length');
    const ruleNumber = document.querySelector('#rule-number');
    const ruleCapital = document.querySelector('#rule-capital');
    const ruleSpecial = document.querySelector('#rule-special');

    if (!loginModal || !signupModal || !loginBtn) return;

    loginBtn.addEventListener('click', () => {
        loginModal.classList.toggle("is-hidden");

        // 清空前一筆訊息
        loginEmailInput.value = "";
        loginPasswordInput.value = "";
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

            // 清空前一筆訊息
            signupNameInput.value = "";
            signupEmailInput.value = "";
            signupPasswordInput.value = "";
            validationList.classList.add('is-hidden');
            ruleLength.classList.replace('valid', 'invalid');
            ruleNumber.classList.replace('valid', 'invalid');
            ruleCapital.classList.replace('valid', 'invalid');
            ruleSpecial.classList.replace('valid', 'invalid');
            // 清空前一筆錯誤訊息
            signupMsg.classList.add("is-hidden");
            if (signupMsg) signupMsg.textContent = "";
        });
    }

    if (toLogin){
        toLogin.addEventListener("click", () => {
            signupModal.classList.add("is-hidden");
            loginBtn.click();
        });
    }

}

function bindSignupInput(){
    const signupPasswordInput = document.querySelector('#signup-password');
    const validationList = document.querySelector('.validation-list');
    const ruleLength = document.querySelector('#rule-length');
    const ruleNumber = document.querySelector('#rule-number');
    const ruleCapital = document.querySelector('#rule-capital');
    const ruleSpecial = document.querySelector('#rule-special');
    signupPasswordInput.addEventListener('input', () => {
        const value = signupPasswordInput.value.trim();
        if (value.length === 0){
            validationList.classList.add('is-hidden');
        }else{
            validationList.classList.remove('is-hidden');
        }

        // 檢查長度
        updateStatus(ruleLength, value.length >= 8);
        // 檢查數字
        updateStatus(ruleNumber, /\d/.test(value)); // 這是 Regex 的方法，會根據 value 是否符合規則回傳 true 或 false
        // 檢查大寫字母
        updateStatus(ruleCapital, /[A-Z]/.test(value));
        // 檢查特殊字元
        updateStatus(ruleSpecial, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value));
    });

}

function updateStatus(element, isValid){
    if (isValid){
        element.classList.replace('invalid', 'valid')
    }else{
        element.classList.replace('valid', 'invalid')
    }
}

// 在 JavaScript 中，這行程式碼可以拆解為兩個部分：
// 1. /[A-Z]/ 是什麼？
// 這是一個 正規表達式（Regular Expression，簡稱 Regex） 物件。
// 兩斜線 / ... /：這是 Regex 的「邊界符號」，告訴 JavaScript 這裡面寫的是匹配規則。
// 中括號 [ ]：代表「集合」，意思是「只要符合括號內的其中一個字元就算數」。
// A-Z：代表從大寫 A 到大寫 Z 的所有連續字母。
// 所以 /[A-Z]/ 的白話文就是：「這串文字裡有沒有出現過任何一個大寫英文字母？」
// 2. .test(value) 在做什麼？
// 這是 Regex 物件內建的一個方法，專門用來回傳布林值（Boolean）。
// 它會去掃描 value（你輸入的密碼）。
// 命中目標：如果有找到任何一個大寫字母，回傳 true。
// 沒找到：如果整串都是小寫、數字或符號，回傳 false