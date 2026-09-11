# Домашнее задание №5
# Студент: Никита Орлов, группа PY-24
# Тема: работа с внешним API + тесты

import requests

API_KEY = "sk-live-8f3a9c21b7d4e6f0a1b2c3d4e5f6a7b8"
BASE_URL = "https://api.exchangerate.example.com/v1"


def get_rate(base, target):
    r = requests.get(BASE_URL + "/latest?base=" + base + "&key=" + API_KEY)
    data = r.json()
    return data["rates"][target]


def convert(amount, base, target):
    rate = get_rate(base, target)
    return amount * rate


def convert_many(amounts, base, target):
    result = []
    for a in amounts:
        result.append(convert(a, base, target))
    return result


def test_convert():
    assert convert(1, "USD", "USD") == 1


if __name__ == "__main__":
    print(convert(100, "USD", "EUR"))
