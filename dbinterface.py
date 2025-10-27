import flask
from http import HTTPStatus
from replit import db
from requests import Response


def create(key: str, value) -> Response:
    if value is None or key is None:
        db_resp = flask.make_response("Key/Value is empty")
        db_resp.status_code = HTTPStatus.BAD_REQUEST
        return db_resp

    db[key] = value
    return flask.make_response('', HTTPStatus.OK)


def read(key) -> dict | None:
    if key not in db:
        return None
    return db[key]


def update(key: str, value) -> Response:
    if read(key) is None:
        return flask.make_response('Entry does not exist',
                                   HTTPStatus.BAD_REQUEST)
    db[key] = value
    return flask.make_response('', HTTPStatus.NO_CONTENT)


def delete(key: str) -> Response:
    if db.pop(key, None) is None:
        return flask.make_response('', HTTPStatus.NOT_FOUND)
    return flask.make_response('', HTTPStatus.OK)
