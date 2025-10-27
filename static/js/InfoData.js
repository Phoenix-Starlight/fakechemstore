class InfoData {
    #info;
    constructor(element) {
        this.#info = { name: element.name, number: element.number };
    }

    get info() { return this.#info; }

    name = document.createElement('div');
    appearance = document.createElement('div');
    phase = document.createElement('div');
    summary = document.createElement('div');
    symbol = document.createElement('div');
}

export default InfoData;