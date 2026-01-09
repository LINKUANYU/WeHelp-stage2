// import function
import { getErrorMsg, request } from "../common/api.js";
import { setupAppShell } from "../components/setup_app_shell.js";
import { applySessionUi } from "../components/apply_session_ui.js";

const listBarList = document.querySelector('.listBar__list');
const leftBtn = document.querySelector('#listBar-left-btn');
const rightBtn = document.querySelector('#listBar-right-btn');
const categoryMenu = document.querySelector('.category__menu');
const searchBtn = document.querySelector('.search__btn');
const cardGrid = document.querySelector('.cardGrid');
const sentinel = document.querySelector('#sentinel');

// ＊＊＊ 以下為建立 「attraction card ＋ 滾動讀取更多」邏輯 ＊＊＊
// 運作邏輯：啟動觀察 -> 被偵測到 -> 讀取更多 -> 按條件抓資料 -> 建立卡片

// initial condition
let page = 0;
let loading = false;  // 因下載資料會花時間，為了避免重複迴圈
let done = false;      // 若沒有下一頁資料done變為true

// IntersectionObserver：讓瀏覽器「監控某個元素」和「某個可視區域」的交集狀態
// entries 是一批「狀態有變化」的觀察結果（每個是 IntersectionObserverEntry）
// isIntersecting 表示 target 目前是否和 root 有交集（至少碰到、重疊到一點點也算）
const observer = new IntersectionObserver(
    (entries) => {
    if (entries[0].isIntersecting){
        loadMore();
    }
    }, {root: null, rootMargin: "0px 0px 0px 0px", threshold: 0}
);
// root null：以「整個瀏覽器視窗」當觀察視窗，element：以「某個容器」當觀察視窗（適合容器內滾動）
// threshold 門檻，代表「交集比例」的觸發點，threshold: 0：只要有一點點交集就算（最常用於無限滾動），threshold: 1：要完全進入可視範圍才算，也可以用陣列 [0, 0.25, 0.5, 1]：跨越任一比例就觸發
// rootMargin 把 root 的可視範圍「擴大或縮小」的偏移量（很重要）："200px 0px"：把 root 上下額外擴大 200px（通常用來「提前載入」，不用真的到底才載），也可以是 "200px 0px -80px 0px"：底部縮小 80px（例如你有 fixed footer 遮住內容時）

async function startup(){
    // 1) 全站UI + 事件綁定
    setupAppShell();

    // 2) UI related with session + User info
    const {loggedIn, user} = await applySessionUi();
    // 3) 本頁
    fetchAndRenderCategoryMenu();
    fetchAndRenderMrtListBar();
    bindListBar();
    bindSearchBtn();

    // 「滾動至視窗底部讀取資料」觀察啟動
    observer.observe(sentinel);

}
startup();

function bindSearchBtn(){
    // 綁定搜尋按鈕事件
    searchBtn.addEventListener('click', () => {
        // 清空先前內容，reset condidtion
        cardGrid.innerHTML = "";
        page = 0;
        done = false;
        loading = false;
        // observe 重新啟動
        observer.unobserve(sentinel);
        observer.observe(sentinel);
    });
}

function bindListBar(){
    // 建立list bar 按鈕事件，scrollBy：相對捲動，left：水平捲動位移量
    leftBtn.addEventListener('click',() => {
        listBarList.scrollBy({left: -step(), behavior: "smooth"});
    });
    
    rightBtn.addEventListener('click',() => {
        listBarList.scrollBy({left: step(), behavior: "smooth"});
    });
}
// 計算每次滑動的位移量，clientWidth：該元素「可視內容看」的寬度
function step(){
    return listBarList.clientWidth * 2 / 3;
}


// Fetch Category Menu
async function fetchAndRenderCategoryMenu() {
    try{
    const result = await request("/api/categories");
    const data = result.data;
    data.forEach(d => {
        // create menu
        const categoryItem = document.createElement('div');
        categoryItem.classList = "category__item u-text-category";
        categoryItem.textContent = d;
        categoryMenu.append(categoryItem);
    });
    }catch(e){
        console.log(getErrorMsg(e));
    }
    const searchCategoriesBtn = document.querySelector('.search__categories-btn');
    // category menu panel event
    searchCategoriesBtn.addEventListener('click', () => {
    categoryMenu.classList.toggle('is-hidden');
    });
    // panel item replace btn text event
    const categoryItems = document.querySelectorAll('.category__item');
    categoryItems.forEach((item) => {
        item.addEventListener('click', () => {
            searchCategoriesBtn.textContent = item.textContent + "▼";
            categoryMenu.classList.toggle('is-hidden');
        });
    });
}

// Fetch List bar
async function fetchAndRenderMrtListBar () {
    try{
    const searchInput = document.querySelector('#search__input');
    const result = await request("/api/mrts");
    const data = result.data;
    data.forEach(d => {
        // create list bar item
        const listBarItem = document.createElement('div');
        listBarItem.classList = "listBar__item u-text-body u-c-sec-70";
        listBarItem.textContent = d;
        listBarList.append(listBarItem);
        // item function: put mrt into search input
        listBarItem.addEventListener('click', () => {
        searchInput.value = listBarItem.textContent;
        // 觸發搜尋
        const searchBtn = document.querySelector('.search__btn');
        searchBtn.click();
        });
    });
    }catch(e){
        console.log(getErrorMsg(e));
    }
}


// Load more Function
async function loadMore(){
    // 避免無限重跑
    if (loading || done) return;
    loading = true;

    // 觸發後先暫停observe，避免就算card內長出來的東西不夠把sentinel推出交集，這裡解掉後面重啟，確保再觸發
    observer.unobserve(sentinel);
    
    // 對應finally，確保還有下一頁資料可讀取的話，到finally再變成true
    let shouldResume = false;

    try{
        const result = await getAttractions(page);
        const data = result.data;
        // 如果找不到資料
        if (!data || data.length === 0) {
            const noData = document.createElement('h1');
            noData.textContent = "NO DATA";
            cardGrid.append(noData);
            // 停止boserve
            done = true;
            observer.disconnect();
            return;
        }
        // 有資料，開始建card
        renderAttractionsCard(data);

        const nextPage = result.nextPage;
        // 如果沒有下一頁了，停止observe
        if (nextPage === null){
            done = true;
            observer.disconnect();
        } else {
            // 有下一頁的話將頁碼更新
            page = nextPage;
            shouldResume = true
        }
    } finally {
        loading = false;
        // 1. 如果還有下一頁資料就重啟observe
        // 2. 避免就算card內長出來的東西不夠把sentinel推出交集，前面解掉後面重啟，確保再觸發
        if (shouldResume) {
            observer.observe(sentinel);
        }
    }
}


// Fetch attractions API
async function getAttractions(page = 0) {
    // 找 category
    const searchCategoriesBtn = document.querySelector('.search__categories-btn');
    let category = searchCategoriesBtn.textContent.replace("▼","");
    if (category === "全部分類"){
        category = null;
    }
    // 找 keyword
    const searchInput = document.querySelector('.search__input');
    const keyword = searchInput.value.trim();    

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
    return await request(url);
}

// Build Attractions HTML
function renderAttractionsCard(data){
    data.forEach(d => {
    // card__media
    const cardTitleText = document.createElement('div');
    cardTitleText.classList = "card__titleText u-text-body--bold u-c-white";
    cardTitleText.textContent = d.name;
    const cardTitle = document.createElement('div');
    cardTitle.classList = "card__title";
    cardTitle.append(cardTitleText);
    const cardImg = document.createElement('img');
    cardImg.classList = "card__img";
    cardImg.src = d.images[0];
    const cardMedia = document.createElement('div');
    cardMedia.classList = "card__media";
    cardMedia.append(cardImg);
    cardMedia.append(cardTitle);
    // card__detail
    const cardInfoMrt = document.createElement('div');
    cardInfoMrt.classList = "card__info card__info--mrt u-text-body u-c-sec-50";
    cardInfoMrt.textContent = d.mrt;
    const cardInfoCategory = document.createElement('div');
    cardInfoCategory.classList = "card__info card__info--category u-text-body u-c-sec-50";
    cardInfoCategory.textContent = d.category;
    const cardDetail = document.createElement('div');
    cardDetail.classList = "card__detail";
    cardDetail.append(cardInfoMrt);
    cardDetail.append(cardInfoCategory);
    // card
    const card = document.createElement('a');
    card.classList = "card u-c-white";
    card.href = `/attraction/${d.id}`;
    card.append(cardMedia);
    card.append(cardDetail);
    // insert card
    cardGrid.append(card);
    });
}
