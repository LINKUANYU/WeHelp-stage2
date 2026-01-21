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
    const data = await getOrderHistory();
    renderPurchase(data);
  }

startup();



async function getOrderHistory(){
  try{
    const res = await request(`/api/order-history`, {
      method: "GET",
      headers: authHeaders()
    });
    if (!res.data){
      console.log("No data")
      return null
    }
    console.log(res.data)
    return res.data
  }catch(e){
   console.log(getErrorMsg(e));
   return null
  }
}

function renderPurchase(data){
  const headline = document.querySelector('#purchase-headline');
  if (!data){
    headline.textContent = "您的歷史訂單如下，總計 0 筆資料";
    return;
  }
  // 開始長卡片
  data.forEach((data) => {
    mountOrderContent({}, data);
  });
  headline.textContent = `您的歷史訂單如下，總計 ${data.length} 筆資料`
  // 避免重複渲染，最後結束放一個標籤
  const markDone = document.createElement('div');
  markDone.classList.add('mark-done');
  document.querySelector('main').append(markDone);
}

function buildAndRenderOrderHistory(data){
  const orderNo = data.order_no;
  const status = data.status;
  const statusText = (status === "UNPAID") ? "尚未付款" : "";
  const attractionName = data.spot_name;
  const attractionAddress = data.spot_address;
  const attractionImage = data.spot_image;
  const date = data.booking_date;
  const time = data.booking_time;
  const price = data.price;
  const timeText = (time === "morning") ? "早上 9 點到下午 4 點" : "下午 5 點到晚上 9 點";
  return `
  <div class="order">
    <div class="order__img">
      <img class="order__img--icon" src="${attractionImage}">
    </div>
    <div class="order__detail u-text-body--bold u-c-pri-70">
      <div class="order__title">台北一日遊：${attractionName}，訂單編號 ${orderNo}
      <div class="unpaid-msg u-text-body--bold">${statusText}</div>
      </div>
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
  <div class="divider margin-20"></div>
    `.trim()
}

function mountOrderContent({mount = document.querySelector('main')} = {}, data){
    if (document.querySelector('.mark-done')) return;
    mount.insertAdjacentHTML("beforeend", buildAndRenderOrderHistory(data));
}
