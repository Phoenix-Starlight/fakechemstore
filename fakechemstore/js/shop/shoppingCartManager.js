import { liveQuery } from "dexie";
import { backendData, backendEndpoints, backendFetchOptions } from "backendData";
import ShoppingCart from "ShoppingCart";

const totalUI = document.getElementById("total");

function setTotal(totalPrice) {
    totalUI.textContent = totalPrice + "$";
}

async function calcPrices(element) {
    const price = await backendData.prices.then(prices => prices[element.name.toLowerCase()]);
    return price * element.units;
}

const getCart = () => ShoppingCart.orders.toArray();
const onCartChange = liveQuery(getCart);

const orderUI = document.getElementById("orders");

class OrderUIManager {
    /** @type {Array} */
    #previousArrayResult;

    constructor() {
        ShoppingCart.orders.toArray().then(o => this.#previousArrayResult = o);
    }

    /** @param {Array} arrayResult */
    updateOrderUI(arrayResult) {
        const newSet = new Set(arrayResult.map(x => x.id));
        const difference = new Set(this.#previousArrayResult.map(x=>x.id).filter(x => !newSet.has(x)));
        if (difference.size != 0) {
            difference.forEach(i => this.deleteOrder(i))
        }

        arrayResult.forEach(setElement);
        Promise.all(arrayResult.map(calcPrices))
            .then(prices => prices.length !== 0 ? prices.reduce((p, n) => p + n) : 0)
            .then(setTotal);
        this.#previousArrayResult = arrayResult;
    }

    deleteOrder(elementNum) {
        ShoppingCart.orders.delete(elementNum).catch(_ => undefined);
        document.getElementById(elementNum).remove();
    }
}

const UIManager = new OrderUIManager();

function setElement(element) {
    const elementUI = document.getElementById(element.id);
    if (elementUI) {
        elementUI.getElementsByTagName("div")[0].childNodes[0].textContent = element.units;
        return;
    }

    const newElementUI = document.createElement("section");
    newElementUI.id = element.id
    const elementName = document.createElement("span");
    const yetAnotherWrapper = document.createElement("div");
    const elementQuantity = document.createElement("span");
    const button = document.createElement("button");

    button.textContent = "Delete";
    button.addEventListener("click", _ => UIManager.deleteOrder(element));
    elementName.textContent = element.name;
    elementQuantity.textContent = element.units + 'kg';

    newElementUI.appendChild(elementName);
    yetAnotherWrapper.appendChild(elementQuantity);
    yetAnotherWrapper.appendChild(button);
    newElementUI.appendChild(yetAnotherWrapper);
    orderUI.appendChild(newElementUI);
}

onCartChange.subscribe({
    next: arr => UIManager.updateOrderUI(arr),
    error: console.error
});

function prepareOrder(elements) {
    const obj = {};
    elements.forEach(element => {
        obj[element.name.toLowerCase()] = element.units;
    });
    return obj;
}

function send_order() {
    ShoppingCart.orders.toArray(prepareOrder)
        .then(order =>
            fetch(backendEndpoints.create_order,
                backendFetchOptions.createResponse("POST", JSON.stringify(order))
            )
        )
        .then(resp => {
            if (resp.status == 401) { window.location.href = "/login.html"; }
            if (!resp.ok) { throw resp; }
            return resp;
        })
        .then(_ => { return ShoppingCart.orders.clear(); })
        .catch(console.error);
}

document.getElementById("send_cart").addEventListener('click', send_order);