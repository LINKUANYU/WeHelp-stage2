/*  這份檔案用來
１．把共用部分的 HTML 長齊全
２．綁定這些共用部分的事件 & API
輸出給各html的 script startup 做執行
*/

import { render_all } from "./render_app_shell.js";
import { bind_login_form, bind_signup_form, bind_signout_btn } from "./auth_form.js";
import { init_auth_modal } from "./auth_modal.js";
import { init_nav_brand } from "./navbar.js";

export function setup_app_shell(){
    render_all();
    init_nav_brand();
    init_auth_modal();
    bind_login_form();
    bind_signup_form();
    bind_signout_btn();
    
}