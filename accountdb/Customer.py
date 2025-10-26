import dbinterface
from flask_login import UserMixin
from replit import database

class Customer(UserMixin):

    def __init__(self, name: str, uid: str, password: str, orders: list):
        self.name = name
        self.id = uid
        self.password = password
        self.orders = orders

    def add_orders(self, orders: dict):
        self.orders.append(orders)

    def get_orders(self):
        return database.dumps(self.orders)

    def delete_order(self, order: int):
        del self.orders[order]

def get(uid: str) -> Customer | None:
    data = dbinterface.read(uid)
    if not data:
        return data
    return Customer(data["name"], uid, data["password"], data["orders"])
