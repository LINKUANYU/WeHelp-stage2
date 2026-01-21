/* 這份檔案用來做/ 會員中心頭像 / 的功能事件綁定 */

export function bindNavAccount(){
    bindAccountMenuBtn();
    bindToMemberBtn();
    bindToPurchaseBtn();
    bindSignoutBtn();
}


function bindAccountMenuBtn(){
    const accountMenuBtn = document.querySelector('#account-menu-btn');
    const accountMenu = document.querySelector('.account-menu');

    const showMenu = () => {
        accountMenu.classList.remove('is-hidden');
    };
    const hideMenu = () => {
        accountMenu.classList.add('is-hidden');
    };

    accountMenuBtn.addEventListener('mouseenter', showMenu);
    accountMenu.addEventListener('mouseenter', showMenu);
    accountMenuBtn.addEventListener('mouseleave', hideMenu);
    accountMenu.addEventListener('mouseleave', hideMenu);
}

function bindToMemberBtn(){
    const toMemberBtn = document.querySelector('#to-member-btn');
    if (!toMemberBtn) return;

    toMemberBtn.addEventListener('click', () => {
        window.location.href = "/member";
    });
}

function bindToPurchaseBtn(){
    const toPurchaseBtn = document.querySelector('#to-purchase-btn');
    if (!toPurchaseBtn) return;

    toPurchaseBtn.addEventListener('click', () => {
        window.location.href = "/purchase";
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



