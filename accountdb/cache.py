import functools
from requests import Response
from typing import Callable

# Must go before flask annotations
def cache(timeout: int = 0) -> Callable:
    def extralayer(func):
        # a decorator that returns another decorator... to accept args
        @functools.wraps(func)
        def cache_decorator(*args, **kwargs):
            response: Response = func(*args, **kwargs)
            response.cache_control.max_age = timeout
            return response
        return cache_decorator
    return extralayer