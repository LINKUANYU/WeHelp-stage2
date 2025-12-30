
export async function get_data(url, option) {
    const res = await fetch(url, option);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok){
        const err = new Error (`HTTP ${res.status}`);
        err.status = res.status;
        err.payload = body;
        err.detail = (body && typeof body === "object" && body.detail) ||
            (typeof body === "string" && body) ||
            `Request failed (${res.status})`;

        throw err;
    }
    return body;
}

export function login_signup(){
    // 登入／註冊 畫面顯示
    const login_modal = document.querySelector('#login-modal');
    const signup_modal = document.querySelector('#signup-modal');
    const login_btn = document.querySelector('#login-btn');
    const modal_close = document.querySelectorAll('.modal__close');
    const modal_backdrop = document.querySelectorAll('.modal__backdrop');
    const to_singup = document.querySelector('.auth__link--signup');
    const to_login = document.querySelector('.auth__link--login');
    login_btn.addEventListener('click', () => {
        login_modal.classList.toggle('is-hidden');
    });
    modal_close.forEach((m) => {
        m.addEventListener('click', () => {
            login_modal.classList.add('is-hidden');
            signup_modal.classList.add('is-hidden');
        });
    });
    modal_backdrop.forEach((m) => {
        m.addEventListener('click', () => {
            login_modal.classList.add('is-hidden');
            signup_modal.classList.add('is-hidden');
        });
    });
    to_singup.addEventListener('click',() => {
        login_modal.classList.add('is-hidden');
        signup_modal.classList.remove('is-hidden');
    });
    to_login.addEventListener('click',() => {
        login_modal.classList.remove('is-hidden');
        signup_modal.classList.add('is-hidden');
    });

    // 登入／註冊 API
    const login_form = document.querySelector('#login-form');
    const signup_form = document.querySelector('#signup-form');
    
    // 登入 API
    login_form.addEventListener('submit',async (e) => {
        const login_email = document.querySelector('#login-email').value.trim();
        const login_password = document.querySelector('#login-password').value;
        const login_msg = document.querySelector('#login-msg');
        e.preventDefault();
        // 檢查input資料是否完整
        if (!login_email || !login_password){
            login_msg.classList.remove('is-hidden');
            login_msg.textContent = "請輸入完整資訊";
            return;
        }
        const form = e.currentTarget  // e.currentTarget：真正綁定的那個元素。e.target：事件最初發生的元素，可能會是按鈕
        const fd = new FormData(form)  // 把<form>內該被提交的欄位組成 key/value
        try{
            const res = await get_data("/api/login", {
                method: "POST",
                body: fd
            }); 

            console.log(res);
            console.log("Login success");  // 待修改
            login_modal.classList.add('is-hidden');
        }catch(e){
            console.log(e);
            login_msg.classList.remove('is-hidden');
            login_msg.textContent = e.detail;
        }
    });
    
    // 註冊 API
    signup_form.addEventListener('submit',async (e) => {
        const signup_name = document.querySelector('#signup-name').value.trim();
        const signup_email = document.querySelector('#signup-email').value.trim();
        const signup_password = document.querySelector('#signup-password').value;
        const signup_msg = document.querySelector('#signup-msg');
        e.preventDefault();
        // 檢查input資料是否完整
        if (!signup_email || !signup_password || !signup_name){
            signup_msg.classList.remove('is-hidden');
            signup_msg.textContent = "請輸入完整資訊";
            return;
        }
        const form = e.currentTarget  // e.currentTarget：真正綁定的那個元素。e.target：事件最初發生的元素，可能會是按鈕
        const fd = new FormData(form)  // 把<form>內該被提交的欄位組成 key/value
        try{
            const res = await get_data("/api/signup", {
                method: "POST",
                body: fd
            }); 

            console.log(res);
            console.log("Signup success");
            signup_modal.classList.add('is-hidden');
        }catch(e){
            console.log(e);
            signup_msg.classList.remove('is-hidden');
            signup_msg.textContent = e.detail;
        }
    });


}