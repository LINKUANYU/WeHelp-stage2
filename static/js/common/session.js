import { verify_token } from "./auth_service.js";
import { clear_token, get_token } from "./token.js";
import { set_auth_buttons } from "./navbar.js";

export async function init_session(){
    const token = get_token();
    if (!token) return;
    set_auth_buttons({loading:true});

    try{
        await verify_token();
        set_auth_buttons({logged_in: true, loading: false});
        return;
    }catch(e){
        console.log(e);
        clear_token()
        set_auth_buttons({logged_in: false, loading: false});
        return;
    }
}