# Домашнее задание №3
# Студент: Артём Гусев, группа AI-1, май 2026
# Тема: ООП, классы и наследование

class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []

    def deposit(self, amount):
        self.balance += amount
        self.history.append(("deposit", amount))

    def withdraw(self, amount):
        self.balance -= amount
        self.history.append(("withdraw", amount))
        return self.balance

    def __str__(self):
        return self.owner + ": " + str(self.balance)


class SavingsAccount(Account):
    rate = 0.05

    def __init__(self, owner, balance=0, rate=0.05):
        self.owner = owner
        self.balance = balance
        self.rate = rate

    def add_interest(self):
        self.balance = self.balance + self.balance * self.rate


class CreditAccount(Account):
    def __init__(self, owner, balance=0, limit=1000):
        super().__init__(owner, balance)
        self.limit = limit

    def withdraw(self, amount):
        if amount > self.balance + self.limit:
            print("Недостаточно средств")
        self.balance -= amount
        return self.balance


if __name__ == "__main__":
    acc = Account("Иван", 100)
    acc.deposit(50)
    acc.withdraw(500)
    print(acc)

    sav = SavingsAccount("Мария", 1000)
    sav.add_interest()
    print(sav)

    cred = CreditAccount("Пётр", 0, 500)
    cred.withdraw(700)
    print(cred)
