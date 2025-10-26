import Dexie from 'dexie';
import InfoData from 'InfoData';
import InvalidArgumentException from 'InvalidArgumentException';

class ShoppingCart {
    /* This isn't persistent, but it'll do. Just don't forget to send the orders. */
    static #db = new Dexie('ShoppingCart');

    static get db() {
        return this.#db;
    }

    /** @return{Table} orders */
    static get orders() {
        return this.#db.elements;
    }

    static {
        this.#db.version(1).stores({
            elements: "id, &name, units"
        });
    }

    static sendOrders() {
        var result = Object.keys(this.orders).map((key) => [key, obj[key]]);
    }

    /*
        @param {InfoData} item
        @return {Promise} promise
    */
    static addToCart(item, quantity) {
        // return the promises!!!
        if (quantity === "" || quantity <= 0) {
            return Promise.reject(new InvalidArgumentException("Invalid input"));
        }
        else if (!(item instanceof InfoData)) {
            return Promise.reject(new InvalidArgumentException("Error: " + item?.toString() + " is not of type " + InfoData.name));
        }
        return this.orders.add({ id: item.info.number, name: item.info.name, units: quantity })
        .catch('ConstraintError', _ => {
            return this.orders.get(item.info.number)
            .then(result => {
                return this.orders.update(item.info.number, { units: result.units + quantity });
            });
        });
    }
}

export default ShoppingCart;