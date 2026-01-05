/*  這份檔案用來
１．把共用部分的 HTML 長齊全
２．綁定這些共用部分的事件 & API
輸出給各html的 script startup 做執行
*/

import { render_app_shell } from "./render_app_shell.js";
import { bind_login_form, bind_signup_form, bind_signout_btn } from "./auth_form.js";
import { init_auth_modal } from "./auth_modal.js";
import { init_nav_brand } from "./navbar.js";

export function setup_app_shell(){
    render_app_shell();
    init_nav_brand();
    init_auth_modal();
    bind_login_form();
    bind_signup_form();
    bind_signout_btn();
    
}

/* 
render（渲染/產生）：把 DOM 結構做出來放進頁面
init（初始化）：讓 UI 元件開始運作（預設狀態 + UI 操作事件）
bind（綁定）：綁「會觸發業務流程」的事件（submit、呼叫 API、資料提交）
*/