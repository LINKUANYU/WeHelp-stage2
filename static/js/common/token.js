export function get_token(){
    return localStorage.getItem("access_token");
}

export function set_token(token){
    localStorage.setItem("access_token", token)
}

export function clear_token(){
    localStorage.removeItem("access_token")
}