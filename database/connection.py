import sqlite3


connection = sqlite3.connect("finance.db")

print("Conexão com o banco realizada!")

connection.close()