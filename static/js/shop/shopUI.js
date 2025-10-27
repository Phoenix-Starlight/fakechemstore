import { backendData } from 'backendData';
import InfoData from 'InfoData';
import ShoppingCart from 'ShoppingCart';
import getTransitionEvent from 'CSSUtils';

/**        <div class='tile'>
            <img src='sub value in here' />
            <div class='info'>
                <div>
                element.name
                </div>
            <div class='overlay info'>
            <div>
                <div>element.name</div>
                <div>appearance</div>
                <div>Room temperature phase</div>
                <div>Summary: summary</div>
                <div>Symbol: symbol</div>
            </div>
                <button>&#x2715</button>
            </div>
            </div>
        </div>
        */
const transitionEnd = getTransitionEvent();

class MouseCatcher {
    static #mouseCatcher = document.getElementById('mousecatcher');
    static block() {
        MouseCatcher.#mouseCatcher.style.setProperty('display', 'unset');
    }
    static unblock() {
        MouseCatcher.#mouseCatcher.style.removeProperty('display');
    }
}

class InfoOverlay {
    /** @type{HTMLElement} */ #overlay;
    #infoContent;
    /** @type{HTMLInputElement} */ #input;
    /** @type{HTMLElement} */ #element;
    /** @type{Boolean} */ #destructed;


    constructor(element) {
        this.#element = element;
    }

    get #closeButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.classList.add('close');
        closeButton.addEventListener('click', e => this.#hideOverlay(e));
        return closeButton;
    }

    get #addToCartButton() {
        const addToCartButton = document.createElement('button');
        addToCartButton.textContent = 'Add to cart 🛒';
        addToCartButton.classList.add('addToCartBtn');
        addToCartButton.addEventListener('click', _ => {
            ShoppingCart.addToCart(this.#infoContent.infoData, this.#input.valueAsNumber)
                .catch(e => {
                    alert('Something went wrong! Please recheck your input to ensure that it is a number.');
                    console.error(e);
                });
        });
        return addToCartButton;
    }

    static get #quantityInput() {
        const input = document.createElement('input');
        input.type = 'number';
        input.name = "quantityOfElements"
        input.autocomplete = 'off';
        input.required = true;
        input.min = 1;
        input.value = 1;
        input.max = Number.MAX_SAFE_INTEGER;
        return input;
    }

    #create_overlay() {
        this.#overlay = document.createElement('div');
        this.#infoContent = generateInfo(this.#element);
        this.#overlay.classList.add('overlay', 'info', "fade");
        this.#overlay.appendChild(this.#infoContent);
        this.#overlay.appendChild(this.#closeButton);
        const cartContainer = document.createElement('div');
        cartContainer.classList.add('overlay', 'addToCart', 'container');
        this.#input = InfoOverlay.#quantityInput;
        cartContainer.appendChild(this.#input);
        cartContainer.appendChild(this.#addToCartButton);
        this.#overlay.appendChild(cartContainer);
        this.#overlay.addEventListener('click', e => e.stopPropagation());
        return this.#overlay;
    }

    #hideOverlay(event) {
        MouseCatcher.unblock();
        this.#overlay.addEventListener(transitionEnd, _ => { this.#destructOverlay(); });
        this.#overlay.classList.remove("unhidden");
        event.stopPropagation();
    }

    #destructOverlay() {
        if(this.#destructed) { return; }
        this.#destructed = true;
        this.#overlay.remove();
        this.#overlay = null;
    }

    showOverlay(tile) {
        this.#destructed = false;
        MouseCatcher.block();
        this.#overlay ??= this.#create_overlay();
        tile.appendChild(this.#overlay);
        this.#overlay.offsetWidth;
        // hack to make browser not optimize away animation
        this.#overlay.classList.add("unhidden");
    }
}

class StartLazyLoadingCounter {
    /** @type{Integer} */ static counter;
}
/* image = {
    url: str
    title: str
    attribution: str
    }
*/
function generateImage(name, image) {
    const img = document.createElement('img');
    img.alt = name;
    img.src = image.url;
    img.title = image.title + '\n' + image.attribution;
    if(StartLazyLoadingCounter.counter >=16) {
        img.loading = 'lazy';
        return img;
    }
    StartLazyLoadingCounter.counter++;
    return img;
}

function generateInfo(element) {
    const info = document.createElement('div');
    const infoData = new InfoData(element);

    infoData.name.textContent = `Name: ${element.name}`;
    infoData.appearance.textContent = `Appearance: ${element.appearance ? element.appearance : 'Unknown'}`;
    infoData.phase.textContent = `Room temperature phase: ${element.phase}`;
    infoData.summary.textContent = `Summary: ${element.summary}`;
    infoData.symbol.textContent = `Symbol: ${element.symbol}`;
    info.textContent = Object.values(infoData).map(i => i.textContent).join("\n");

    info.infoData = infoData;
    return info;
}

function generateTile(element, image) {
    const tileFrag = document.createDocumentFragment();
    const divTile = document.createElement('div');
    const sampleImage = generateImage(element.name, image);
    const info = divTile.cloneNode(true);
    const imageWrap = divTile.cloneNode(true);
    const tileName = divTile.cloneNode(true);
    tileName.textContent = element.name;
    sampleImage.setAttribute('draggable', false);
    imageWrap.classList.add('img');
    imageWrap.appendChild(sampleImage);
    info.appendChild(tileName);
    info.classList.add('info');
    divTile.appendChild(imageWrap);
    divTile.appendChild(info);
    divTile.classList.add('tile');
    divTile.addEventListener('click', _ => {
        const infoOverlay = new InfoOverlay(element);
        infoOverlay.showOverlay(divTile);
    });
    tileFrag.appendChild(divTile);
    return tileFrag;
}

function placeTile(elements) {
    const gallery = document.createDocumentFragment();
    const table = Object.values(elements);
    for (const data of table) {
        gallery.appendChild(generateTile(data, data.image));
    }
    return gallery;
}

const gallery = document.getElementsByClassName('gallery')[0];

backendData.elements
    .then(placeTile)
    .then(tile => gallery.appendChild(tile));