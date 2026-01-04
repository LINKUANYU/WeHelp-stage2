import { login, signup } from "./auth_service.js";
import { get_error_msg } from "./api.js";

export function bind_login_form(){
    const login_form = document.querySelector('#login-form');
    if (!login_form) return;

    const login_modal = document.querySelector('#login-modal')
    const login_msg = document.querySelector('#login-msg');

    login_form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const login_email = document.querySelector('#login-email').value.trim();
        const login_password = document.querySelector('#login-password').value;

        if (!login_email || !login_password){
            if (login_msg){
                login_msg.classList.remove("is-hidden");
                login_msg.textContent = "請輸入完整資訊";
            }
            return;
        }

        const fd = new FormData(e.currentTarget);

        try{
            const res = await login(fd);
            const token = res.token;
            if (token) localStorage.setItem("access_token", token);
            if (login_modal) login_modal.classList.add("is-hidden");
            window.location.reload()
        }catch(e){
            if (login_msg){
                login_msg.classList.remove("is-hidden");
                login_msg.textContent = get_error_msg(e);
            }
        }
    });
}

export function bind_signup_form(){
    const signup_form = document.querySelector('#signup-form');
    if (!signup_form) return;

    const signup_modal = document.querySelector('#signup-modal');
    const signup_msg = document.querySelector('#signup-msg');

    signup_form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const signup_name = document.querySelector("#signup-name").value.trim();
        const signup_email = document.querySelector("#signup-email").value.trim();
        const signup_password = document.querySelector("#signup-password").value;

        if (!signup_email || !signup_password || !signup_name) {
            if (signup_msg) {
                signup_msg.classList.remove("is-hidden");
                signup_msg.textContent = "請輸入完整資訊";
            }
            return;
        }

        const fd = new FormData(e.currentTarget);

        try{
            await signup(fd);
            if (signup_modal) signup_modal.classList.add("is-hidden");
        }catch(e){
            console.log(e);
            if (signup_msg){
                signup_msg.classList.remove("is-hidden");
                signup_msg.textContent = get_error_msg(e);
            }
        }
    });
}

export function bind_signout_btn(){
    const signout_btn = document.querySelector('#signout-btn');
    if (!signout_btn) return;

    signout_btn.addEventListener('click', () => {
        localStorage.removeItem("access_token");
        window.location.reload();
    });
}

