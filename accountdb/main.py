# """A simple proxy to Repl.it Database.

# Great for sharing one database among many repls.

# Warning: you might want to add authentication to this, otherwise
# anyone can access the database!"""

import Customer
import dbinterface
import flask
from flask_compress import Compress
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, current_user, logout_user
from http import HTTPStatus
from http.client import HTTPException
import simplejson as json
import os
from passlib.hash import pbkdf2_sha256

login_manager = LoginManager()
# Shut up flask static since its not controllable in caching
app = flask.Flask(__name__, static_url_path='', static_folder='null')
# sess = requests.Session()

app.config["COMPRESS_REGISTER"] = False
# Dont forget compress annotation due to it being disabled globally
app.config.update(SESSION_COOKIE_SAMESITE='Lax',
                  SESSION_COOKIE_SECURE=True,
                  SESSION_COOKIE_HTTPONLY=True,
                  REMEMBER_COOKIE_DOMAIN='.repl.dev')

cacheconfig = {
    "CACHE_DEFAULT_TIMEOUT": 604800  # Seconds, 1 week
}

permittedorigins = [
    #    "https://formexample.phoenixstarlight.repl.co",
    #    "https://fakechemstore.phoenixstarlight.repl.co",
    #    Replit Dev migration
    "https://8fde70de-8311-47e1-adac-384fcee031ee-00-3eowbmrkq0ir6.worf.replit.dev"
]

for origin in permittedorigins.copy():
    # repl sometimes uses --
    # copy() due to otherwise infinitely attempting to find and replace
    # if CORS goes wrong due to this I'm blaming repl
    permittedorigins.append(
        origin.replace(".phoenixstarlight", "--phoenixstarlight", 1))

compress = Compress(app)
cors = CORS(app, origins=permittedorigins, supports_credentials=True)
login_manager.init_app(app)

app.secret_key = os.environ['AUTH_KEY']

static = "static"
lookupindex = json.load(open(f"{static}/order.json"))


def checkJSONData(jsondata, *args: str) -> bool:
    if jsondata is None:
        return False
    for key in args:
        if not key in jsondata:
            return False
    return True


@app.errorhandler(HTTPStatus.CONFLICT)
@app.errorhandler(HTTPStatus.BAD_REQUEST)
@app.errorhandler(HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
@app.errorhandler(HTTPException)
def handle_exception(exception):
    response = exception.get_response()
    response.mimetype = "application/json"
    response.data = json.dumps({"code": exception.code})
    return response


@login_manager.user_loader
def load_user(username: str):
    if not username:
        return
    return Customer.get(username)


@app.route(f'/{static}/<path:path>')
# @cachedecorator.cache(timeout=cacheconfig["CACHE_DEFAULT_TIMEOUT"])
# Can control caching via kwargs passed to send_file
@compress.compressed()
def serve_files(path):
    file = flask.send_from_directory(
        f'{static}', path, max_age=cacheconfig["CACHE_DEFAULT_TIMEOUT"])
    file.add_etag()
    return file


@app.route("/api/v1/signup", methods=["POST"])
# JSON only
def signup():
    if current_user.is_authenticated:
        return flask.jsonify({"msg": "Already authenticated"})

    jsondata = flask.request.json
    if not checkJSONData(jsondata, "name", "username", "password"):
        flask.abort(HTTPStatus.BAD_REQUEST)

    if dbinterface.read(jsondata["username"]) is not None:
        flask.abort(HTTPStatus.CONFLICT)

    dbinterface.create(
        jsondata["username"], {
            "name": jsondata["name"],
            "password": pbkdf2_sha256.hash(jsondata["password"]),
            "orders": {}
        })

    return flask.jsonify(None)


@app.route("/api/v1/login", methods=["POST"])
# Receives JSON with keys username and password.
def login():
    if current_user.is_authenticated:
        return flask.jsonify({"msg": "Already authenticated"})

    jsondata = flask.request.json
    if not checkJSONData(jsondata, "username", "password"):
        flask.abort(HTTPStatus.BAD_REQUEST)
    customer = Customer.get(jsondata["username"])
    if customer is None or not pbkdf2_sha256.verify(jsondata["password"],
                                                    customer.password):
        return flask.make_response(
            {
                "code": HTTPStatus.FORBIDDEN,
                "msg": "Invalid Credentials"
            }, HTTPStatus.FORBIDDEN)

    login_user(customer)
    return flask.jsonify({"msg": "Authorized"})


@app.route("/api/v1/create_order", methods=["POST"])
@login_required
def create_order():
    # """
    # Receives JSON that is an order
    # Element should be named
    # {"hydrogen": 6} for example. 6 units of Hydrogen.
    # """
    order = flask.request.json
    if not isinstance(order, dict):
        print("dict fail")
        flask.abort(HTTPStatus.BAD_REQUEST)

    if any(element not in lookupindex for element in order):
        print("wrong elements")
        flask.abort(HTTPStatus.BAD_REQUEST)

    current_user.add_orders(order)
    return flask.Response(status=HTTPStatus.NO_CONTENT)


@app.route("/api/v1/get_orders", methods=["GET"])
@login_required
# Returns JSON array of orders
def get_orders():
    return flask.make_response(current_user.get_orders(), HTTPStatus.OK)


@app.route("/api/v1/delete_orders", methods=["POST"])
@login_required
# Gets elements to be deleted - accepts single or multiple orders
def delete_order():
    index = flask.request.json
    if not isinstance(index, list):
        flask.abort(HTTPStatus.BAD_REQUEST)
    index.sort()
    try:
        for i in index:
            if i < 0:
                flask.abort(HTTPStatus.BAD_REQUEST)
            current_user.delete_order(i)
    except IndexError:
        flask.abort(HTTPStatus.BAD_REQUEST)
    return flask.Response(status=HTTPStatus.NO_CONTENT)

@app.route("/api/v1/self", methods=["GET"])
@login_required
# determine if logged in
def identify():
    return flask.Response(status=HTTPStatus.NO_CONTENT)

@app.route("/api/v1/logout", methods=["GET"])
@login_required
def logout():
    logout_user()
    nuke_cookie = flask.Response(status=HTTPStatus.NO_CONTENT)
    nuke_cookie.delete_cookie("session")
    return nuke_cookie
# uncomment this to run:
app.run("0.0.0.0", port=5000)
