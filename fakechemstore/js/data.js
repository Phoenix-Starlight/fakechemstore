/**
 * @param {string} string - path
 */
function backend(string) {
    return "https://73c5cb6b-4c97-427d-9a4d-e29785beda0f-00-22dzj2bbgho1n.worf.replit.dev" + string;
}

/**
 * @param {Response} response - json response
 */
function parseJsonResp(response) {
    return response.json();
}

const options = {
    mode: 'cors',
    redirect: 'follow'
};

class backendData {
    static #elements = fetch(backend("/static/periodic-table.json"), options).then(parseJsonResp);
    static #prices = fetch(backend("/static/prices.json"), options).then(parseJsonResp);
    static get elements() { return backendData.#elements; }
    static get prices() { return backendData.#prices; }
}

class backendEndpoints {
    static get signup() { return backend("/api/v1/signup"); }
    static get login() { return backend("/api/v1/login"); }
    static get logout() { return backend("/api/v1/logout"); }
    static get self() { return backend("/api/v1/self"); }
    static get create_order() { return backend("/api/v1/create_order"); }
    static get orders() { return backend("/api/v1/get_orders"); }
    static get delete_orders() { return backend("/api/v1/delete_orders"); }
}

class backendFetchOptions {
    /** @param {string} body */
    /** @param {string} method */
    static createResponse(method, body=false) {
        return {
            method: method,
            mode: "cors",
            ...(body) && {body: body},
            credentials: 'include',
            headers: new Headers({
                "Content-Type": "application/json;charset=UTF-8"
            })
        }
    }
}

export { backendData, backendEndpoints, backendFetchOptions };