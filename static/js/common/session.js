import { verify_token } from "./auth_service.js";
import { set_auth_buttons } from "./navbar.js";

export async function init_session(){
    const token = localStorage.getItem("access_token");
    if (!token) return;
    set_auth_buttons({loading:true});

    try{
        await verify_token();
        set_auth_buttons({logged_in: true, loading: false});
        return;
    }catch(e){
        localStorage.removeItem("access_token");
        set_auth_buttons({logged_in: false, loading: false});
        return;
    }
}