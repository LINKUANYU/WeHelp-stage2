// import function
import { request } from "../common/api.js";
import { setup_app_shell } from "../components/init_app_shell.js";
import { init_session } from "../common/session.js";


async function startup(){
    // 1) 全站UI + 事件綁定
    setup_app_shell();

    // 2) session
    init_session();
}

startup();
