// import function
import { authHeaders, getErrorMsg, request } from "../common/api.js";
import { setupAppShell } from "../components/setup_app_shell.js";
import { applySessionUi } from "../components/apply_session_ui.js";
import { getSession } from "../common/session.js";

// 透過url尋找當前頁面資料
const pathPart = window.location.pathname.split("/").filter(Boolean);
// pathname 只取「路徑」部分，不含網域、不含 ?、不含 #。
// filter 會把陣列每個元素丟進去測試，回傳「通過條件」的元素。把空字串 ""（以及其他 falsy 值）過濾掉
const attractionId = pathPart[1];

const name = document.querySelector('.profile__name');
const mrt = document.querySelector('.profile__cat-mrt');
const description = document.querySelector('#description');
const address = document.querySelector('#address');
const transport = document.querySelector('#transport');

const track = document.querySelector('.carousel__track');
const prevBtn = document.querySelector('.carousel__nav--prev');
const nextBtn = document.querySelector('.carousel__nav--next');
const indicator = document.querySelector('.carousel__indicator');

let photos = [];
let idx = 0;

async function startup(){
    // 1) 全站UI + 事件綁定
    setupAppShell();

    // 2) UI related with session + User info
    const {loggedIn, user} = await applySessionUi();
    
    // 3) 本頁
    await fetchAndRenderAttractionPage();
    bindSlide();
    bindBookingPrice();
    bindBookingSubmitBtn();

    moveSlide();  // 初始化按鈕disable & indicator active
}

startup();





async function fetchAndRenderAttractionPage(){
    // get attraction data
    try{
        const result = await request(`/api/attraction/${attractionId}`);
        // fill html information 
        name.textContent = result.data.name;
        mrt.textContent = result.data.name + " at " + result.data.mrt;
        description.textContent = result.data.description;
        address.textContent = result.data.address;
        transport.textContent = result.data.transport;
        // 建立相片slide
        photos = result.data.images;
        buildSlide();
    }catch(e){
        console.log(getErrorMsg(e));
    }
}

function buildSlide() {
    photos.forEach((p) => {
    const slide = document.createElement('div');
    slide.className = "carousel__slide";
    const img = document.createElement('img');
    img.className = "carousel__img";
    img.src = p;
    slide.append(img);
    track.append(slide);
    });
    // build indicator
    const counts = photos.length;
    for (let i = 0; i < counts; i++){
        const seg = document.createElement('div');
        seg.className = "carousel__indicator-seg";
        indicator.append(seg);
    }
}


function bindSlide(){
    // 綁定按鈕功能
    prevBtn.addEventListener('click', () => {
        if (idx === 0) return;
        idx -= 1;
        moveSlide();
    });

    nextBtn.addEventListener('click', () => {
        if (idx === photos.length - 1) return;
        idx += 1;
        moveSlide();
    });
}

function moveSlide(){
    // 水平移動畫面
    const w = track.clientWidth;
    track.style.transform = `translateX(${-idx * w}px)`;
    // 檢查按鈕狀態，每次render 檢查是否達成條件
    prevBtn.disabled = (idx === 0);  // 等號右邊放布林值
    nextBtn.disabled = (idx === photos.length - 1);
    
    // 更新分段進度條畫面
    const segs = document.querySelectorAll('.carousel__indicator-seg');
    segs.forEach((seg, i) => {
        seg.classList.remove('is-active');
        if (i === idx){
            seg.classList.add('is-active');
        }
    });
}

function bindBookingPrice(){
    document.querySelectorAll('input[name="time"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {  // 當radio 被選中，從unchecked -> checked 值發生變化，觸發change事件。
            const time = e.target.value;  // e.target.value 等於此刻被選中的 radio 的 value，也就是morning/afternoon
            const price_el = document.querySelector('.booking__price');
            const price = (time === "morning") ? 2000 : 2500;
            price_el.textContent = `新台幣${price}`;
        });
    });
}

// booking btn event
function bindBookingSubmitBtn(){
    const bookingSubmitBtn = document.querySelector('#booking-submit-btn');
    bookingSubmitBtn.addEventListener('click', async(e) => {
        e.preventDefault();
        // 先驗證是否登入
        const {loggedIn} = await getSession(); // 點擊按鈕時再次確認當下的session
        if (!loggedIn){
            const loginBtn = document.querySelector('#login-btn');
            loginBtn.click();
            return;
        }

        const data = buildBookingPayload();
        if (!data) return; 

        const {date, time, price} = data;
        // 組織送API
        try{
            const res = await request("/api/booking", {
                method: "POST",
                headers: authHeaders({"content-type": "application/json"}),
                body: JSON.stringify({attraction_id: attractionId, date: date, time: time, price: price})
            });
            if (res.ok){
                window.location.href = "/booking";
            }
        }catch(e){
            console.log(getErrorMsg(e));
        }
    });
}

function buildBookingPayload(){
    const date = document.querySelector('.booking__date').value; // 沒選日期也會是""。空字串.value不會爆
    const timeEl = document.querySelector('input[name="time"]:checked');
    
    if (!date) {alert("請選擇日期"); return}
    if (!timeEl) {alert("請選擇上半天／下半天"); return}

    const time = timeEl.value;
    const price = (time === "morning") ? 2000 : 2500;

    return {date, time, price}
}
