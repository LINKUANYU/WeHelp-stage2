// import function
import { request } from "../common/api.js";
import { setup_app_shell } from "../components/setup_app_shell.js";
import { apply_session_ui } from "../components/apply_session_ui.js";


// 透過url尋找當前頁面資料
const path_part = window.location.pathname.split("/").filter(Boolean);
// pathname 只取「路徑」部分，不含網域、不含 ?、不含 #。
// filter 會把陣列每個元素丟進去測試，回傳「通過條件」的元素。把空字串 ""（以及其他 falsy 值）過濾掉
const attrraction_id = path_part[1];


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
        const result = await request(`/api/attraction/${attrraction_id}`);
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

async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();

    // 2) UI related with session
    await apply_session_ui();
    
    // 3) 本頁
    load_attraction();
    // booking time and price
    radio_morning.addEventListener('change', () => {
        booking_price.textContent = "新台幣2000元";
    });
    radio_afternoon.addEventListener('change', () => {
        booking_price.textContent = "新台幣2500元";
    });

}
startup();