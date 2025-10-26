import { backendEndpoints, backendFetchOptions } from "backendData";

function logout(e) {
    e.preventDefault();
    fetch(backendEndpoints.logout,
         backendFetchOptions.createResponse("GET")
    ).then(
        _ => window.location.href = "/"
    )
}

fetch(backendEndpoints.self,
    backendFetchOptions.createResponse("GET")
).then(
    resp => {
        if (resp.ok) {
            const account = document.getElementById("account");
            account.addEventListener('click', logout)
            account.textContent = 'Logout';
        }
    }
)