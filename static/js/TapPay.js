
// Overview
// 設定三個 tappay field container
// 利用 TPDirect.setupSDK 設定參數
// 使用 TPDirect.card.setup 設定外觀
// TPDirect.card.onUpdated 取得 TapPay Fields 狀態
// 利用 TPDirect.card.getPrime 來取得 prime 字串

export function initTapPay(){
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

    payBtn.addEventListener("click", onSubmit);
    payBtn.disabled = true; // 預設先關閉，等 canGetPrime 再開

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
                                                
        // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unknown']
        if (update.cardType === 'visa') {
            // Handle card type visa.
        }

        // number 欄位是錯誤的
        if (update.status.number === 2) {
            // setNumberFormGroupToError()
        } else if (update.status.number === 0) {
            // setNumberFormGroupToSuccess()
        } else {
            // setNumberFormGroupToNormal()
        }
        
        if (update.status.expiry === 2) {
            // setNumberFormGroupToError()
        } else if (update.status.expiry === 0) {
            // setNumberFormGroupToSuccess()
        } else {
            // setNumberFormGroupToNormal()
        }
        
        if (update.status.ccv === 2) {
            // setNumberFormGroupToError()
        } else if (update.status.ccv === 0) {
            // setNumberFormGroupToSuccess()
        } else {
            // setNumberFormGroupToNormal()
        }
    })


    // 4. Get Tappay Fields Status
    TPDirect.card.getTappayFieldsStatus()
    // 此方法可得到 TapPay Fields 卡片資訊的輸入狀態
    // 與 TPDirect.card.onUpdate Callback 物件相同

    // 5. Get Prime
    // call TPDirect.card.getPrime when user submit form to get tappay prime
    // $('form').on('submit', onSubmit)
    function onSubmit(event) {
        event.preventDefault()

        // 取得 TapPay Fields 的 status
        const tappayStatus = TPDirect.card.getTappayFieldsStatus()

        // 確認是否可以 getPrime
        if (tappayStatus.canGetPrime === false) {
            alert('can not get prime')
            return
        }

        // Get prime
        TPDirect.card.getPrime((result) => {
            if (result.status !== 0) {
                alert('get prime error ' + result.msg)
                return
            }
            alert('get prime 成功，prime: ' + result.card.prime)

            // send prime to your server, to pay with Pay by Prime API .
            // Pay By Prime Docs: https://docs.tappaysdk.com/tutorial/zh/back.html#pay-by-prime-api
        })
    }
}