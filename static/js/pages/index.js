// import function
import { request } from "../common/api.js";
import { setup_app_shell } from "../components/setup_app_shell.js";
import { apply_session_ui } from "../components/apply_session_ui.js";

const bar = document.querySelector('.listBar');
const listBar_list = bar.querySelector('.listBar__list');
const left_btn = bar.querySelector('#listBar-left-btn');
const right_btn = bar.querySelector('#listBar-right-btn');
const category_menu = document.querySelector('.category__menu');
const search_btn = document.querySelector('.search__btn');
const card_grid = document.querySelector('.cardGrid');
const sentinel = document.querySelector('#sentinel');

async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();

    // 2) UI related with session + User info
    const {logged_in, user} = await apply_session_ui();
    // 3) 本頁
    build_category_menu();
    build_list_bar();
    
    // 建立list bar 按鈕事件，scrollBy：相對捲動，left：水平捲動位移量
    left_btn.addEventListener('click',() => {
        listBar_list.scrollBy({left: -step(), behavior: "smooth"});
    });
    
    right_btn.addEventListener('click',() => {
        listBar_list.scrollBy({left: step(), behavior: "smooth"});
    });

    // 綁定搜尋按鈕事件
    search_btn.addEventListener('click', () => {
        // 清空先前內容，reset condidtion
        card_grid.innerHTML = "";
        page = 0;
        done = false;
        loadding = false;
        // observe 重新啟動
        observer.unobserve(sentinel);
        observer.observe(sentinel);
    });

    // 啟動觀察
    observer.observe(sentinel);

}
startup();




// Fetch Category Menu
async function build_category_menu() {
    try{
    const result = await request("/api/categories");
    const data = result.data;
    data.forEach(d => {
        // create menu
        const category_item = document.createElement('div');
        category_item.classList = "category__item u-text-category";
        category_item.textContent = d;
        category_menu.append(category_item);
    });
    }catch(e){
        console.log(e);
    }
    const search_categories_btn = document.querySelector('.search__categories-btn');
    // category menu panel event
    search_categories_btn.addEventListener('click', () => {
    category_menu.classList.toggle('is-hidden');
    });
    // panel item replace btn text event
    const category__items = document.querySelectorAll('.category__item');
    category__items.forEach((item) => {
        item.addEventListener('click', () => {
            search_categories_btn.textContent = item.textContent + "▼";
            category_menu.classList.toggle('is-hidden');
        });
    });
}

// Fetch List bar
async function build_list_bar () {
    try{
    const search_input = document.querySelector('#search__input');
    const result = await request("/api/mrts");
    const data = result.data;
    data.forEach(d => {
        // create list bar item
        const listBar_item = document.createElement('div');
        listBar_item.classList = "listBar__item u-text-body u-c-sec-70";
        listBar_item.textContent = d;
        listBar_list.append(listBar_item);
        // item function: put mrt into search input
        listBar_item.addEventListener('click', () => {
        search_input.value = listBar_item.textContent;
        // 觸發搜尋
        const search_btn = document.querySelector('.search__btn');
        search_btn.click();
        });
    });
    }catch(e){
        console.log(e)
    }
}

// 計算每次滑動的位移量，clientWidth：該元素「可視內容看」的寬度
function step(){
    return listBar_list.clientWidth * 2 / 3;
}

// ＊＊＊ 以下為建立 「attraction card ＋ 滾動讀取更多」邏輯 ＊＊＊
// 運作邏輯：啟動觀察 -> 被偵測到 -> 讀取更多 -> 按條件抓資料 -> 建立卡片

// initial condition
let page = 0;
let loadding = false;  // 因下載資料會花時間，為了避免重複迴圈
let done = false;      // 若沒有下一頁資料done變為true

// IntersectionObserver：讓瀏覽器「監控某個元素」和「某個可視區域」的交集狀態
// entries 是一批「狀態有變化」的觀察結果（每個是 IntersectionObserverEntry）
// isIntersecting 表示 target 目前是否和 root 有交集（至少碰到、重疊到一點點也算）
const observer = new IntersectionObserver(
    (entries) => {
    if (entries[0].isIntersecting){
        load_more();
    }
    }, {root: null, rootMargin: "0px 0px 0px 0px", threshold: 0}
);
// root null：以「整個瀏覽器視窗」當觀察視窗，element：以「某個容器」當觀察視窗（適合容器內滾動）
// threshold 門檻，代表「交集比例」的觸發點，threshold: 0：只要有一點點交集就算（最常用於無限滾動），threshold: 1：要完全進入可視範圍才算，也可以用陣列 [0, 0.25, 0.5, 1]：跨越任一比例就觸發
// rootMargin 把 root 的可視範圍「擴大或縮小」的偏移量（很重要）："200px 0px"：把 root 上下額外擴大 200px（通常用來「提前載入」，不用真的到底才載），也可以是 "200px 0px -80px 0px"：底部縮小 80px（例如你有 fixed footer 遮住內容時）


// Load more Function
async function load_more(){
    // 避免無限重跑
    if (loadding || done) return;
    loadding = true;

    // 觸發後先暫停observe，避免就算card內長出來的東西不夠把sentinel推出交集，這裡解掉後面重啟，確保再觸發
    observer.unobserve(sentinel);
    
    // 對應finally，確保還有下一頁資料可讀取的話，到finally再變成true
    let should_resume = false;

    try{
    const result = await get_attractions(page);
    const data = result.data;
    // 如果找不到資料
    if (!data || data.length === 0) {
        const no_data = document.createElement('h1');
        no_data.textContent = "NO DATA";
        card_grid.append(no_data);
        // 停止boserve
        done = true;
        observer.disconnect();
        return;
    }
    // 有資料，開始建card
    build_attractions_card(data);

    const next_page = result.nextPage;
    // 如果沒有下一頁了，停止observe
    if (next_page === null){
        done = true;
        observer.disconnect();
    } else {
        // 有下一頁的話將頁碼更新
        page = next_page;
        should_resume = true
    }
    } finally {
        loadding = false;
        // 1. 如果還有下一頁資料就重啟observe
        // 2. 避免就算card內長出來的東西不夠把sentinel推出交集，前面解掉後面重啟，確保再觸發
        if (should_resume) {
            observer.observe(sentinel);
        }
    }
}


// Fetch attractions API
async function get_attractions(page = 0) {
    // 找 category
    const search__categories_btn = document.querySelector('.search__categories-btn');
    let category = search__categories_btn.textContent.replace("▼","");
    if (category === "全部分類"){
        category = null;
    }
    // 找 keyword
    const search_input = document.querySelector('.search__input');
    const keyword = search_input.value.trim();    

    // 組織url
    let url = `/api/attractions?page=${page}`;
    if (category && keyword){
    url += `&category=${category}&keyword=${keyword}`
    }
    else if (category){
    url += `&category=${category}`
    }
    else if (keyword){
    url += `&keyword=${keyword}`
    }
    // 用組織好的url 去抓資料
    try{
    const result = await request(url);
    return result;
    }catch(e){
        console.log(e);
    }
}

// Build Attractions HTML
function build_attractions_card(data){
    const card_grid = document.querySelector('.cardGrid');
    data.forEach(d => {
    // card__media
    const card_title_text = document.createElement('div');
    card_title_text.classList = "card__titleText u-text-body--bold u-c-white";
    card_title_text.textContent = d.name;
    const card_title = document.createElement('div');
    card_title.classList = "card__title";
    card_title.append(card_title_text);
    const card_img = document.createElement('img');
    card_img.classList = "card__img";
    card_img.src = d.images[0];
    const card_media = document.createElement('div');
    card_media.classList = "card__media";
    card_media.append(card_img);
    card_media.append(card_title);
    // card__detail
    const card_info_mrt = document.createElement('div');
    card_info_mrt.classList = "card__info card__info--mrt u-text-body u-c-sec-50";
    card_info_mrt.textContent = d.mrt;
    const card_info_category = document.createElement('div');
    card_info_category.classList = "card__info card__info--category u-text-body u-c-sec-50";
    card_info_category.textContent = d.category;
    const card_detail = document.createElement('div');
    card_detail.classList = "card__detail";
    card_detail.append(card_info_mrt);
    card_detail.append(card_info_category);
    // card
    const card = document.createElement('a');
    card.classList = "card u-c-white";
    card.href = `/attraction/${d.id}`;
    card.append(card_media);
    card.append(card_detail);
    // insert card
    card_grid.append(card);
    });
}
