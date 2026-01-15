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
    const orderNumber = getOrderNumber();
    const data = await getOrderDetail(orderNumber);
    await renderThankyou(data);
  }

startup();


function getOrderNumber(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const orderNumber = urlParams.get('number');
  return orderNumber;
}

async function getOrderDetail(orderNumber){
  try{
    const res = await request(`/api/order/${orderNumber}`, {
      method: "GET",
      headers: authHeaders()
    });
    return res.data
  }catch(e){
   console.log(getErrorMsg(e)); 
   if (e.status === 403){
    alert("沒有訪問權限");
    window.location.href = "/";
    return null
   }
  }
}

async function renderThankyou(data){
  const headline = document.querySelector('.booking-headline');
  if (!data){
    headline.textContent = "查無訂單，請重試";
    return;
  }
  const orderNumber = data.number;
  const orderStatus = data.status;

  if (orderStatus !== "PAID"){
    headline.textContent = `您的訂單已建立成功，編號：${orderNumber}，尚未完成付款`
  }else{
    headline.textContent = `您的訂單已建立成功，編號：${orderNumber}，已完成付款，期待與您相會！`
  }
  mountBookingContent({}, data);
  const transport = await fetchTranSport(data);
  mountTranSport({}, transport);
  
}

function buildAndRenderBookingContent(data){
    const attractionName = data.trip.attraction.name;
    const attractionAddress = data.trip.attraction.address;
    const attractionImage = data.trip.attraction.image;
    const date = data.trip.date;
    const time = data.trip.time;
    const price = data.price;
    const timeText = (time === "morning") ? "早上 9 點到下午 4 點" : "下午 5 點到晚上 9 點";
    return `
  <div class="order">
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
    `.trim()
}

function mountBookingContent({mount = document.querySelector('.booking-headline')} = {}, data){
    if (document.querySelector('.order')) return;
    mount.insertAdjacentHTML("afterend", buildAndRenderBookingContent(data));
}

async function fetchTranSport(data){
  const attractionId = Number(data.trip.attraction.id);
  const res = await request(`/api/attraction/${attractionId}`)
  return res.data.transport;
}

function buildAndRenderTranSport(transport){
  return`
    <div class="attraction-info--orderpage">
      <div class="info-section">
        <div class="info-section__title u-text-body--bold u-c-sec-70">交通方式：</div>
        <div class="u-text-content u-c-sec-70 u-line-height--2" id="transport">${transport}</div>
      </div>
    </div>
  `.trim()
}

function mountTranSport({mount = document.querySelector('footer')} = {}, transport){
  if (document.querySelector('.info-section')) return;
  mount.insertAdjacentHTML("beforebegin", buildAndRenderTranSport(transport));
}



