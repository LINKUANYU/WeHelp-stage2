/* 這份檔案用來做/ 台北一日遊回首頁 / 的功能事件綁定 */

export function bindNavBrand(){
    // Homepage
    const navBrand = document.querySelector('.nav__brand');
    if (!navBrand) return;

    navBrand.addEventListener('click', () => {
        window.location.href = "/";
    });
}



