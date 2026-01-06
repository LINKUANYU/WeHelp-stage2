/*
這份檔案用來長共用的 HTML，包含header, footer, login-modal, singup-modal
最後傳出去給 init 做渲染
*/

function top_html(){
    return `
    <!-- login modal -->
    <div class="modal is-hidden" id="login-modal">
        <div class="modal__backdrop"></div>
        <div class="modal__content modal__content--login">
        <div class="modal__decorator-bar"></div>
        <div class="modal__close">
            <img class="modal__close-icon" src="/static/icon/close.png">
        </div>
        <div class="modal__body">
            <form id="login-form">
            <div class="modal__title u-text-headline3 u-c-sec-70">登入會員帳號</div>
            <input class="auth__input" id="login-email" placeholder="輸入電子信箱" name="email">
            <input class="auth__input" id="login-password" placeholder="輸入密碼" name="password" type="password">
            <button type="submit" class="auth__submit u-bg-pri-70 u-c-white u-text-btn">登入帳戶</button>
            <div class="is-hidden error-msg" id="login-msg"></div>
            <div class="auth__hint u-c-sec-70 u-text-body">
                還沒有帳戶？<div class="auth__link--signup">點此註冊</div>
            </div>
            </form>
        </div>
        </div>
    </div>
    <!-- signup modal -->
    <div class="modal is-hidden" id="signup-modal">
        <div class="modal__backdrop"></div>
        <div class="modal__content modal__content--signup">
        <div class="modal__decorator-bar"></div>
        <div class="modal__close">
            <img class="modal__close-icon" src="/static/icon/close.png">
        </div>
        <div class="modal__body">
            <form id="signup-form">
            <div class="modal__title u-text-headline3 u-c-sec-70">註冊會員帳號</div>
            <input class="auth__input" id="signup-name" placeholder="輸入姓名" name="name">
            <input class="auth__input" id="signup-email" placeholder="輸入電子信箱" name="email">
            <input class="auth__input" id="signup-password" placeholder="輸入密碼" name="password" type="password">
            <button type="submit" class="auth__submit u-bg-pri-70 u-c-white u-text-btn">註冊新帳戶</button>
            <div class="is-hidden error-msg" id="signup-msg"></div>
            <div class="auth__hint u-c-sec-70 u-text-body">
                已經有帳戶了？<div class="auth__link--login">點此登入</div>
            </div>
            </form>
        </div>
        </div>
    </div>
    <!-- Header -->
    <header class="l-header">
        <div class="nav">
        <div class="nav__brand u-text-headline2 u-c-pri-70">台北一日遊</div>
        <div class="nav__menu">
            <button class="nav__btn u-text-body u-c-sec-70 u-bg-white" id="booking-btn">預定行程</button>
            <button class="nav__btn u-text-body u-c-sec-70 u-bg-white" id="login-btn">登入/註冊</button>
            <button class="nav__btn is-hidden u-text-body u-c-sec-70 u-bg-white" id="signout-btn">登出系統</button>
        </div>
        </div> 
    </header>
    `.trim();
}

function footer_html(){
    return `
    <!-- Footer -->
    <div class="l-footer u-bg-sec-50">
        <div class="footer__text u-text-body--bold u-c-white">COPYRIGHT © 2021 台北一日遊</div>
    </div>
    `.trim();
}

function top_render({mount = document.body} = {}){
    // 避免重複生成
    if (document.querySelector('.l-header') || document.querySelector('.modal')) return;
    mount.insertAdjacentHTML("afterbegin", top_html());
}

function footer_render({mount = document.body} = {}){
    // 避免重複生成
    if (document.querySelector('.l-footer')) return;
    mount.insertAdjacentHTML("beforeend", footer_html());
}

export function render_app_shell(){
    top_render();
    footer_render();
}