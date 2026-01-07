export async function request(url, option = {}){
    const res = await fetch(url, option);

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text()

    if (!res.ok){
        const err = new Error (`HTTP ${res.status}`);
        err.status = res.status;
        err.payload = body;
        throw err
    }

    return body;
}

export function get_error_msg(err){
    return err.payload.detail.message;
}

export function auth_headers(extra = {}){
    const headers = new Headers(extra);  // 如果有傳入別的Header 就建立
    const token = localStorage.getItem("access_token"); 
    if (token) headers.set("Authorization", `bearer ${token}`); // 在Header內多建立一個key, value
    return headers;
}
