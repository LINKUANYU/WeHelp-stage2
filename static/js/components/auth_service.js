/* 這份檔案用來做 註冊／登入／驗證token 的 API 內容 */
import { request, auth_headers } from "../common/api.js";

export async function login(fd) {
    return request("/api/user/auth", {
        method: "PUT",
        body: fd,
    });
}

export async function signup(fd){
    return request("/api/user", {
        method: "POST",
        body: fd,
    })
}

export async function verify_token(){
    return request("/api/user/auth", {
        headers: auth_headers()
    })
}