// import function
import { auth_headers, get_error_msg, request } from "../common/api.js";
import { setup_app_shell } from "../components/setup_app_shell.js";
import { apply_session_ui } from "../components/apply_session_ui.js";
import { get_session } from "../common/session.js";


// 透過url尋找當前頁面資料
const path_part = window.location.pathname.split("/").filter(Boolean);
// pathname 只取「路徑」部分，不含網域、不含 ?、不含 #。
// filter 會把陣列每個元素丟進去測試，回傳「通過條件」的元素。把空字串 ""（以及其他 falsy 值）過濾掉
const attraction_id = path_part[1];


const name = document.querySelector('.profile__name');
const cat_mrt = document.querySelector('.profile__cat-mrt');
const description = document.querySelector('#description');
const address = document.querySelector('#address');
const transport = document.querySelector('#transport');

const radio_morning = document.querySelector('input[type="radio"][value="morning"]');
const radio_afternoon = document.querySelector('input[type="radio"][value="afternoon"]');
const booking_price = document.querySelector('.booking__price');

const track = document.querySelector('.carousel__track');
const prev_btn = document.querySelector('.carousel__nav--prev');
const next_btn = document.querySelector('.carousel__nav--next');
const indicator = document.querySelector('.carousel__indicator');

let photos = [];
let idx = 0;

function build_slide() {
    photos.forEach((p) => {
    const slide = document.createElement('div');
    slide.classList = "carousel__slide";
    const img = document.createElement('img');
    img.classList = "carousel__img";
    img.src = p;
    slide.append(img);
    track.append(slide);
    });
    // build indicator
    const counts = photos.length;
    for (let i = 0; i < counts; i++){
    const seg = document.createElement('div');
    seg.classList = "carousel__indicator-seg";
    indicator.append(seg);
    }
}

function render() {
    // 水平移動畫面
    const w = track.clientWidth;
    track.style.transform = `translateX(${-idx * w}px)`;
    // 檢查按鈕狀態，每次render 檢查是否達成條件
    prev_btn.disabled = (idx === 0);  // 等號右邊放布林值
    next_btn.disabled = (idx === photos.length - 1);
    
    // 更新分段進度條畫面
    const segs = document.querySelectorAll('.carousel__indicator-seg');
    segs.forEach((seg, i) => {
    seg.classList.remove('is-active');
    if (i === idx){
        seg.classList.add('is-active');
    }
    });
}

async function load_attraction(){
    try{
        const result = await request(`/api/attraction/${attraction_id}`);
        // Text information
        name.textContent = result.data.name;
        cat_mrt.textContent = result.data.name + " at " + result.data.mrt;
        description.textContent = result.data.description;
        address.textContent = result.data.address;
        transport.textContent = result.data.transport;
        
    
        // 建立相片切換功能
        photos = result.data.images;
        build_slide();
        render();
        // 綁定按鈕功能
        prev_btn.addEventListener('click', () => {
            if (idx === 0) return;
            idx -= 1;
            render();
        });

        next_btn.addEventListener('click', () => {
            if (idx === photos.length - 1) return;
            idx += 1;
            render();
        });
        
    }catch(e){
    console.log(e);
    }

}

// booking btn event
function bind_booking_submit_btn(){
    const booking_submit_btn = document.querySelector('#booking-submit-btn');
    booking_submit_btn.addEventListener('click', async(e) => {
        e.preventDefault();
        // 先驗證是否登入
        const {logged_in} = await get_session();
        if (!logged_in){
            const login_btn = document.querySelector('#login-btn');
            login_btn.click();
            return;
        }

        const data = booking_data();
        if (!data) return; // booking_data 驗證失敗

        const {attraction_id, date, time, price} = data;
        console.log(data);
        try{
            const res = await request("/api/booking", {
                method: "POST",
                headers: auth_headers({"content-type": "application/json"}),
                body: JSON.stringify({attraction_id, date, time, price})
            });
            if (res.ok){
                window.location.href = "/booking";
            }
        }catch(e){
            console.log(get_error_msg(e));
        }
    });
}

function booking_data(){
    const path_part = window.location.pathname.split("/").filter(Boolean);
    const attraction_id = Number(path_part[1]);
    const date = document.querySelector('.booking__date').value; // 沒選日期也會是""
    const time_el = document.querySelector('input[name="time"]:checked');
    const price = Number(document.querySelector('.booking__price').dataset.price);
    
    if (!date){
        alert("請選擇日期");
        return
    }
    if (!time_el){
        alert("請選擇上半天／下半天");
        return
    }

    const time = time_el.value;

    return {attraction_id, date, time, price}
}

function bind_booking_price(){
    document.querySelectorAll('input[name="time"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {  // 當radio 被選中，從unchecked -> checked 值發生變化，觸發change事件。
            const time = e.target.value;  // e.target.value 等於此刻被選中的 radio 的 value，也就是morning/afternoon
            const price_el = document.querySelector('.booking__price');
            const price = (time === "morning") ? 2000 : 2500;
            price_el.textContent = `新台幣${price}`;
            price_el.dataset.price = String(price); // 存在標籤上的屬性，方便之後送data到後端
        });
    });
}


async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();

    // 2) UI related with session
    await apply_session_ui();
    
    // 3) 本頁
    load_attraction();
    bind_booking_price();
    bind_booking_submit_btn()

}
startup();