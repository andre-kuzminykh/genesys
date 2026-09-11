# Домашнее задание №2
# Студент: Мария Соколова, группа AI-1, май 2026
# Тема: списки, словари, генераторы

from typing import Iterable


def unique_sorted(numbers: Iterable[int]) -> list[int]:
    """Возвращает отсортированный список уникальных чисел."""
    return sorted(set(numbers))


def group_by_first_letter(words: list[str]) -> dict[str, list[str]]:
    """Группирует слова по первой букве."""
    groups: dict[str, list[str]] = {}
    for word in words:
        if not word:
            continue
        groups.setdefault(word[0].lower(), []).append(word)
    return groups


def moving_average(values: list[float], window: int) -> list[float]:
    """Скользящее среднее с окном window."""
    if window <= 0:
        raise ValueError("window должен быть положительным")
    return [
        sum(values[i:i + window]) / window
        for i in range(len(values) - window + 1)
    ]


def top_n(counter: dict[str, int], n: int) -> list[tuple[str, int]]:
    """N самых частых элементов."""
    return sorted(counter.items(), key=lambda item: item[1], reverse=True)[:n]


def flatten(nested: list) -> list:
    """Разворачивает вложенные списки любой глубины."""
    result = []
    for item in nested:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result


if __name__ == "__main__":
    print(unique_sorted([3, 1, 2, 3, 1]))
    print(group_by_first_letter(["апельсин", "арбуз", "банан"]))
    print(moving_average([1, 2, 3, 4, 5], 2))
    print(top_n({"a": 5, "b": 9, "c": 1}, 2))
    print(flatten([1, [2, [3, [4]]]]))
