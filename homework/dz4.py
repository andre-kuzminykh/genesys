# Домашнее задание №4
# Студент: Дарья Лебедева, группа PY-24
# Тема: файлы, исключения, валидация данных

import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class Student:
    name: str
    email: str
    score: int

    def validate(self) -> list[str]:
        errors = []
        if not self.name.strip():
            errors.append("имя не может быть пустым")
        if "@" not in self.email:
            errors.append(f"некорректный email: {self.email}")
        if not 0 <= self.score <= 100:
            errors.append(f"балл вне диапазона 0..100: {self.score}")
        return errors


def read_students(path: Path) -> list[Student]:
    """Читает студентов из CSV. Битые строки пропускает с предупреждением."""
    students: list[Student] = []
    with path.open(encoding="utf-8", newline="") as f:
        for line_no, row in enumerate(csv.DictReader(f), start=2):
            try:
                student = Student(
                    name=row["name"],
                    email=row["email"],
                    score=int(row["score"]),
                )
            except (KeyError, ValueError) as exc:
                print(f"строка {line_no}: пропущена, {exc}")
                continue
            students.append(student)
    return students


def save_report(students: list[Student], path: Path) -> None:
    payload = {
        "total": len(students),
        "valid": [asdict(s) for s in students if not s.validate()],
        "invalid": [
            {"student": asdict(s), "errors": s.validate()}
            for s in students
            if s.validate()
        ],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def average_score(students: list[Student]) -> float:
    valid = [s.score for s in students if not s.validate()]
    if not valid:
        return 0.0
    return sum(valid) / len(valid)


if __name__ == "__main__":
    data = Path("students.csv")
    if data.exists():
        items = read_students(data)
        save_report(items, Path("report.json"))
        print(f"средний балл: {average_score(items):.2f}")
    else:
        print("файл students.csv не найден")
