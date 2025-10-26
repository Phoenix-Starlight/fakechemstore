import { backendEndpoints, backendFetchOptions } from "backendData";

function signup(e) {
    e.preventDefault();
    /** @type {HTMLInputElement} */
    const email = document.getElementById("email");
    /** @type {HTMLInputElement} */
    const password = document.getElementById("password");
    /** @type {HTMLInputElement} */
    const name = document.getElementById("name");

    fetch(backendEndpoints.signup,
        backendFetchOptions.createResponse("POST",
            JSON.stringify({ 
                username: email.value,
                name: name.value,
                password: password.value })
        )
    ).then(response => {
        if (!response.ok) { throw response; }
        window.location.href = "/";
    }).catch(
        reply => reply.json().then(r => {
            if (r.code == 409) { return "Already exists"; }
            return r.code;
        }).then(alert)
    );
}

document.getElementById("loginform").addEventListener('submit', signup)