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
    renderThankyou(data)
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

function renderThankyou(data){
  const headline = document.querySelector('.thankyou-headline');
  const headlineMsg = document.querySelector('.thankyou-msg');
  if (!data){
    headline.textContent = "查無訂單，請重試"
  }
  const orderNumber = data.number;
  const orderStatus = data.status;

  if (orderStatus !== "PAID"){
    headline.textContent = `您的訂單已建立成功，編號：${orderNumber}，尚未完成付款`
  }else{
    headline.textContent = `您的訂單已建立成功，編號：${orderNumber}，已完成付款，期待與您相會！`
  }
  
}



