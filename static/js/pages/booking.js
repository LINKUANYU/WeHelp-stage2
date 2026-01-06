// import function
import { request } from "../common/api.js";
import { setup_app_shell } from "../components/setup_app_shell.js";
import { apply_session_ui } from "../components/apply_session_ui.js";
import { get_session } from "../common/session.js";


async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();
    // 2) UI related with session
    await apply_session_ui();
    // 3) 本頁
    const {logged_in} = await get_session();
    if (!logged_in){
        window.location.href = "/";
    }
}

startup();
