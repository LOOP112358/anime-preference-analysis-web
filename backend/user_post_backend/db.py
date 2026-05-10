import pymysql

def get_conn():
    conn = pymysql.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="0727",
        database="anime_web",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn