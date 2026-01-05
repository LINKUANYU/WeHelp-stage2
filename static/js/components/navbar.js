/* 這份檔案用來做
１．「台北一日遊」事件綁定
２．檢查使用者狀態後回饋 登入／登出 ＵＩ (export 到 session.js)
*/

export function init_nav_brand(){
    const nav_brand = document.querySelector('.nav__brand');
    if (!nav_brand) return;

    nav_brand.addEventListener('click', () => {
        window.location.href = "/";
    });
}


/**
 * loading: 初始載入 session 時避免「登入/登出閃爍」
 * - loading=true：兩顆都先藏
 * - loggedIn=true：顯示登出
 * - loggedIn=false：顯示登入/註冊
 */
export function set_auth_buttons({ logged_in, loading = false }) {
  const login_btn = document.querySelector("#login-btn");
  const signout_btn = document.querySelector("#signout-btn");
  if (!login_btn || !signout_btn) return;

  if (loading) {
    login_btn.classList.add("is-hidden");
    signout_btn.classList.add("is-hidden");
    return;
  }

  if (logged_in) {
    login_btn.classList.add("is-hidden");
    signout_btn.classList.remove("is-hidden");
  } else {
    login_btn.classList.remove("is-hidden");
    signout_btn.classList.add("is-hidden");
  }
}