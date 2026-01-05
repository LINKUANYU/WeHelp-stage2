/* 這份檔案用來做 「台北一日遊」事件綁定 */

export function init_nav_brand(){
    const nav_brand = document.querySelector('.nav__brand');
    if (!nav_brand) return;

    nav_brand.addEventListener('click', () => {
        window.location.href = "/";
    });
}



