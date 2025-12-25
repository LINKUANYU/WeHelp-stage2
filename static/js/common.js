export async function get_data(url) {
    const res = await fetch(url);
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok){
        const err = new Error (`HTTP ${res.status}`);
        err.status = res.status;
        err.payload = body;
        throw err;
    }
    return body;
}

export function login(){
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
}