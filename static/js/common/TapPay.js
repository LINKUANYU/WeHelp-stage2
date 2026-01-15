
// Overview
// 設定三個 tappay field container
// 利用 TPDirect.setupSDK 設定參數
// 使用 TPDirect.card.setup 設定外觀
// TPDirect.card.onUpdated 取得 TapPay Fields 狀態
// 綁定按鈕事件利用 TPDirect.card.getPrime 來取得 prime 字串(放在booking.js)

let tappayInited = false;

export function initTapPay(){
    if (tappayInited) return; // 避免重複初始化
    // 1. 三個 tappay field container (在HTML檔案中)
    // 2. Setup SDK
    TPDirect.setupSDK(166458, 'app_Slp64fmN9qdfUkv4J29ruz5VQ3kpnfT6o1F9lZnSvo0hm9fHV3X4Di3FLvwv', 'sandbox')

    // 3. TPDirect.card.setup(config)
    // 以下提供必填 CCV 以及選填 CCV 的 Example
    // 必填 CCV Example
    let fields = {
        number: {
            // css selector
            element: '#card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            // DOM object
            element: document.getElementById('card-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: '#card-ccv',
            placeholder: '後三碼'
        }
    }


    TPDirect.card.setup({
        fields: fields,
        styles: {
            // Style all elements
            'input': {
                'color': 'gray'
            },
            // Styling ccv field
            'input.ccv': {
                // 'font-size': '16px'
            },
            // Styling expiration-date field
            'input.expiration-date': {
                // 'font-size': '16px'
            },
            // Styling card-number field
            'input.card-number': {
                // 'font-size': '16px'
            },
            // style focus state
            ':focus': {
                // 'color': 'black'
            },
            // style valid state
            '.valid': {
                'color': 'green'
            },
            // style invalid state
            '.invalid': {
                'color': 'red'
            },
            // Media queries
            // Note that these apply to the iframe, not the root window.
            '@media screen and (max-width: 400px)': {
                'input': {
                    'color': 'orange'
                }
            }
        },
        // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
        isMaskCreditCardNumber: true,
        maskCreditCardNumberRange: {
            beginIndex: 6, 
            endIndex: 11
        }
    })

    const payBtn = document.querySelector("#pay-btn");
    if (!payBtn) {
        console.error("#pay-btn not found");
        return;
    }

    // 3. onUpdate
    TPDirect.card.onUpdate(function (update) {
        // update.canGetPrime === true
        // --> you can call TPDirect.card.getPrime()
        if (update.canGetPrime) {
            // Enable submit Button to get prime.
            // submitButton.removeAttribute('disabled')
            payBtn.removeAttribute('disabled');
        } else {
            // Disable submit Button to get prime.
            // submitButton.setAttribute('disabled', true)
            payBtn.setAttribute('disabled', true);
        }

        /* Change card type display when card type change */
        /* ============================================== */
        // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unknown']
        const cardtypeEl = document.querySelector('#cardtype');
        let newType = update.cardType === 'unknown' ? '' : update.cardType
        cardtypeEl.textContent = newType.toUpperCase();


        /* Change form-group style when tappay field status change */
        /* ======================================================= */
        const cardNumberGroup = document.querySelector('.card-number-group');
        const expireationDateGroup = document.querySelector('.expiration-date-group');
        const ccvGroup = document.querySelector('.ccv-group');

        // number 欄位是錯誤的
        if (update.status.number === 2) {
            setNumberFormGroupToError(cardNumberGroup);
        } else if (update.status.number === 0) {
            setNumberFormGroupToSuccess(cardNumberGroup);
        } else {
            setNumberFormGroupToNormal(cardNumberGroup);
        }
        
        if (update.status.expiry === 2) {
            setNumberFormGroupToError(expireationDateGroup);
        } else if (update.status.expiry === 0) {
            setNumberFormGroupToSuccess(expireationDateGroup);
        } else {
            setNumberFormGroupToNormal(expireationDateGroup);
        }
        
        if (update.status.ccv === 2) {
            setNumberFormGroupToError(ccvGroup);
        } else if (update.status.ccv === 0) {
            setNumberFormGroupToSuccess(ccvGroup);
        } else {
            setNumberFormGroupToNormal(ccvGroup);
        }
    })

    // 4. Get Tappay Fields Status
    TPDirect.card.getTappayFieldsStatus()
    // 此方法可得到 TapPay Fields 卡片資訊的輸入狀態
    // 與 TPDirect.card.onUpdate Callback 物件相同

}


// 5. Get Prime 
// call TPDirect.card.getPrime when user submit form to get tappay prime
export function getPrime(){
    // 取得 TapPay Fields 的 status
    const tappayStatus = TPDirect.card.getTappayFieldsStatus()

    // 確認是否可以 getPrime
    if (tappayStatus.canGetPrime === false) {
        return Promise.reject(new Error("can not get prime"));
    }
    // 如果可以就包裝成 promise 回傳 prime（因為getPrime 原生不支援await）
    // new Promise 狀態(Pending, resolve 成功, reject 失敗會給Error抓到)
    return new Promise((resolve, reject) => {
        TPDirect.card.getPrime((result) => {
            if (result.status !== 0) {
                reject(new Error (`get prime error: ${result.msg}`));
                return;
            }
            resolve(result.card.prime);
        })
    })
    // send prime to your server, to pay with Pay by Prime API .
    // Pay By Prime Docs: https://docs.tappaysdk.com/tutorial/zh/back.html#pay-by-prime-api
}


function setNumberFormGroupToError(el) {
    el.classList.add('has-error');
    el.classList.remove('has-success');
}

function setNumberFormGroupToSuccess(el) {
    el.classList.remove('has-error');
    el.classList.add('has-success');
}

function setNumberFormGroupToNormal(el) {
    el.classList.remove('has-error');
    el.classList.remove('has-success');
}