// import function
import { authHeaders, getErrorMsg, request } from "../common/api.js";
import { setupAppShell } from "../components/setup_app_shell.js";
import { applySessionUi } from "../components/apply_session_ui.js";

async function startup(){
    // 1) 全站UI + 事件綁定
    setupAppShell();
    // 2) UI related with session + User info
    const {loggedIn, user} = await applySessionUi();
    // 3) 本頁
    // 沒登入的不能從url進來
    if (!loggedIn){
        window.location.href = "/";
        return
    }
    // 本頁渲染
    await fetchAndRenderBooking(user);
    // 綁定刪除按鈕事件
    bindDeleteBooking();
}

startup();





async function fetchAndRenderBooking(user){
    // Headline name
    document.querySelector('.booking-headline').textContent = `您好，${user.name}，待預訂的行程如下：`;
    // 先打get api 拿資料
    const data = await getBookingData();
    // 如果沒有資料
    if (!data){  
      // 顯示「無資料」
      document.querySelector('.empty-msg').classList.remove('is-hidden');
      return;
    }else{
      // 隱藏「無資料」
      document.querySelector('.empty-msg').classList.add('is-hidden');
      // 開始長html
      renderBookingHtml({}, data, user);
    }
}

async function getBookingData(){
    try{
        const res = await request("/api/booking", {
            method: "GET",
            headers: authHeaders()
        });
        if (!res.data){
            // 沒有資料不用長html
            return null
        }else{
            return res;
        }
        
    }catch(e){
        console.log(getErrorMsg(e));
    }
}

function buildBookingHtml(data, user){
    const userName = user.name;
    const userEmail = user.email;
    const attractionId = data.data.attraction.id;
    const attractionName = data.data.attraction.name;
    const attractionAddress = data.data.attraction.address;
    const attractionImage = data.data.attraction.image;
    const date = data.data.date;
    const time = data.data.time;
    const price = data.data.price;
    const timeText = (time === "morning") ? "早上 9 點到下午 4 點" : "下午 5 點到晚上 9 點";
    return `
  <div class="order">
    <button class="delete-icon u-bg-white" id="delete-booking-btn">
      <img src="/static/icon/icon_delete.png">
    </button>
    <div class="order__img">
      <img class="order__img--icon" src="${attractionImage}">
    </div>
    <div class="order__detail u-text-body--bold u-c-pri-70">
      <div class="order__title">台北一日遊：${attractionName}</div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">日期：</div>
        <div class="order__item u-text-body u-c-sec-70">${date}</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">時間：</div>
        <div class="order__item u-text-body u-c-sec-70">${timeText}</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">費用：</div>
        <div class="order__item u-text-body u-c-sec-70">新台幣 ${price} 元</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">地點：</div>
        <div class="order__item u-text-body u-c-sec-70">${attractionAddress}</div>
      </div>
    </div>
  </div>
  <hr class=" divider divider--1200 divider--sp">
  <div class="contact">
    <div class="contact__title u-text-btn--bold u-c-sec-70">您的聯絡資訊</div>
    <div class="contact__field">
      <div class="u-text-body--400 u-c-sec-70">聯絡姓名：</div>
      <input class="contact__input contact__input--name u-text-body u-c-sec-70" value="${userName}">
    </div>
    <div class="contact__field">
      <div class="u-text-body--400 u-c-sec-70">聯絡信箱：</div>
      <input class="contact__input contact__input--email u-text-body u-c-sec-70" value="${userEmail}">
    </div>
    <div class="contact__field">
      <div class="u-text-body--400 u-c-sec-70">手機號碼：</div>
      <input class="contact__input contact__input--phone u-text-body u-c-sec-70">
    </div>
    <div class="contact__info u-text-body--bold u-c-sec-70">請保持手機暢通，準時到達，導覽人員將用手機與您聯繫，務必留下正確的聯絡方式。</div>
  </div>
  <hr class="divider divider--1200">
  <div class="payment">
    <div class="payment__title u-text-btn--bold u-c-sec-70">信用卡付款資訊</div>
    <div class="payment__field">
      <div class="u-text-body--400 u-c-sec-70">卡片號碼：</div>
      <input class="payment__input payment__input--number">
    </div>
    <div class="payment__field">
      <div class="u-text-body--400 u-c-sec-70">過期時間：</div>
      <input class="payment__input payment__input--expiry">
    </div>
    <div class="payment__field">
      <div class="u-text-body--400 u-c-sec-70">驗證密碼：</div>
      <input class="payment__input payment__input--cvv">
    </div>
  </div>
  <hr class="divider divider--1200">
  <div class="confirmation">
    <div class="confirmation__title u-text-body--bold u-c-sec-70">總價：新台幣 ${price} 元</div>
    <button class="confirmation__btn u-text-btn--400 u-c-white u-bg-pri-70">確認訂購並付款</button>
  </div>
    `.trim()
}

function renderBookingHtml({mount = document.querySelector('.booking-headline')} = {}, data, user){
    if (document.querySelector('.order')) return;
    mount.insertAdjacentHTML("afterend", buildBookingHtml(data, user));
}

function bindDeleteBooking(){
    const deleteBtn = document.querySelector('#delete-booking-btn');
    if (!deleteBtn) return;
    deleteBtn.addEventListener('click', async() => {
        try{
            const res = await request("/api/booking", {
                method: "DELETE",
                headers: authHeaders()
            });
            if (res.ok) window.location.reload();
            return
        }catch(e){
            console.log(getErrorMsg(e));
        }
    });
}



