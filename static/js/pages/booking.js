// import function
import { auth_headers, get_error_msg, request } from "../common/api.js";
import { setup_app_shell } from "../components/setup_app_shell.js";
import { apply_session_ui } from "../components/apply_session_ui.js";
import { get_session } from "../common/session.js";


async function setup_booking(user){
    // Headline name
    document.querySelector('.booking-headline').textContent = `您好，${user.name}，待預訂的行程如下：`;
    // 先打get api 拿資料
    const data = await get_booking_data();
    // 如果沒有資料
    if (!data){  
      // 顯示「無資料」
      document.querySelector('.empty-msg').classList.remove('is-hidden');
      return;
    }else{
      // 隱藏「無資料」
      document.querySelector('.empty-msg').classList.add('is-hidden');
      // 開始長html
      render_booking_html({}, data, user);
      bind_delete_booking();
    }
}

async function get_booking_data(){
    try{
        const res = await request("/api/booking", {
            method: "GET",
            headers: auth_headers()
        });
        if (!res.data){
            // 沒有資料不用長html
            return null
        }else{
            return res;
        }
        
    }catch(e){
        console.log(get_error_msg(e));
    }
}

function build_booking_html(data, user){
    const user_name = user.name;
    const user_email = user.email;
    const attraction_id = data.data.attraction.id;
    const attraction_name = data.data.attraction.name;
    const attraction_address = data.data.attraction.address;
    const attraction_image = data.data.attraction.image;
    const date = data.data.date;
    const time = data.data.time;
    const price = data.data.price;
    return `
  <div class="order">
    <button class="delete-icon u-bg-white" id="delete-booking-btn">
      <img src="/static/icon/icon_delete.png">
    </button>
    <div class="order__img">
      <img class="order__img--icon" src="${attraction_image}">
    </div>
    <div class="order__detail u-text-body--bold u-c-pri-70">
      <div class="order__title">台北一日遊：${attraction_name}</div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">日期：</div>
        <div class="order__item u-text-body u-c-sec-70">${date}</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">時間：</div>
        <div class="order__item u-text-body u-c-sec-70">${time}</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">費用：</div>
        <div class="order__item u-text-body u-c-sec-70">新台幣 ${price} 元</div>
      </div>
      <div class="order__field">
        <div class="u-text-body--bold u-c-sec-70">地點：</div>
        <div class="order__item u-text-body u-c-sec-70">${attraction_address}</div>
      </div>
    </div>
  </div>
  <hr class=" divider divider--1200 divider--sp">
  <div class="contact">
    <div class="contact__title u-text-btn--bold u-c-sec-70">您的聯絡資訊</div>
    <div class="contact__field">
      <div class="u-text-body--400 u-c-sec-70">聯絡姓名：</div>
      <input class="contact__input contact__input--name u-text-body u-c-sec-70" value="${user_name}">
    </div>
    <div class="contact__field">
      <div class="u-text-body--400 u-c-sec-70">聯絡信箱：</div>
      <input class="contact__input contact__input--email u-text-body u-c-sec-70" value="${user_email}">
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

function render_booking_html({mount = document.querySelector('.booking-headline')} = {}, data, user){
    if (document.querySelector('.order')) return;
    mount.insertAdjacentHTML("afterend", build_booking_html(data, user));
}

function bind_delete_booking(){
    const delete_btn = document.querySelector('#delete-booking-btn');
    delete_btn.addEventListener('click', async() => {
        try{
            const res = await request("/api/booking", {
                method: "DELETE",
                headers: auth_headers()
            });
            if (res.ok) window.location.reload();
            return
        }catch(e){
            console.log(get_error_msg(e));
        }
    });
}

async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();
    // 2) UI related with session + User info
    const {logged_in, user} = await apply_session_ui();
    // 3) 本頁
    // 沒登入的不能key url進來
    if (!logged_in){
        window.location.href = "/";
        return
    }
    // 本頁渲染
    await setup_booking(user);
    
}

startup();

