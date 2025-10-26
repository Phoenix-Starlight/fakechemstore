import { backendEndpoints, backendFetchOptions } from "backendData";

function login(e) {
    e.preventDefault();
    /** @type {HTMLInputElement} */
    const email = document.getElementById("email");
    /** @type {HTMLInputElement} */
    const password = document.getElementById("password");
    fetch(backendEndpoints.login,
        backendFetchOptions.createResponse("POST",
            JSON.stringify({ username: email.value, password: password.value })
        )
    ).then(response => {
        if (!response.ok) { throw response; }
        window.location.href = "/";
    }).catch(
        reply => reply.json()
            .then(r => r.msg)
            .then(alert)
    );
}

document.getElementById("loginform").addEventListener('submit', login)