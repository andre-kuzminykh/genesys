# Домашнее задание №1
# Студент: Иван Петров, группа AI-1, май 2026
# Тема: работа со строками и функциями

def count_words(text):
    words = text.split(" ")
    return len(words)


def reverse_words(text):
    words = text.split(" ")
    result = ""
    for w in words:
        result = result + w[::-1] + " "
    return result


def is_palindrome(s):
    s = s.lower()
    return s == s[::-1]


def capitalize_all(text):
    words = text.split(" ")
    res = []
    for i in range(len(words)):
        res.append(words[i][0].upper() + words[i][1:])
    return " ".join(res)


if __name__ == "__main__":
    print(count_words("привет как дела"))
    print(reverse_words("abc def"))
    print(is_palindrome("А роза упала на лапу Азора"))
    print(capitalize_all("hello world"))
