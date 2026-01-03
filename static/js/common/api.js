import { get_token } from "./token.js";

export function auth_headers(extra = {}){
    const token = get_token();
    const headers = new Headers(extra);
    if (token) headers.set("Authorization", `bearer ${token}`);
    return headers;
}

export function get_error_msg(err){
    return (
        err?.payload?.detail?.message ||
        err?.payload?.detail ||
        err?.payload?.message ||
        err?.message ||
        "Unknow message"
    );
}

export async function request(url, option = {}){
    const res = await fetch(url, option);

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text()

    if (!res.ok){
        const err = new Error `HTTP ${res.status}`;
        err.status = res.status;
        err.payload = body;
        throw err
    }

    return body;
}