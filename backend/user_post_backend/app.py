from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)


def get_conn():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="0727",
        database="anime_web",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )


def ok(message="获取成功", data=None):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    })


def fail(message="操作失败"):
    return jsonify({
        "success": False,
        "message": message,
        "data": None
    })


# 用户注册
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    user_name = data.get("user_name")
    password = data.get("password")

    if not user_name or not password:
        return fail("用户名和密码不能为空")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "INSERT INTO user(user_name, password) VALUES(%s, %s)"
            cur.execute(sql, (user_name, password))
            conn.commit()
        return ok("注册成功")
    except Exception as e:
        return fail("注册失败：" + str(e))
    finally:
        conn.close()


# 用户登录
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user_name = data.get("user_name")
    password = data.get("password")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT user_id, user_name, photo, user_intro, create_at
            FROM user
            WHERE user_name=%s AND password=%s
            """
            cur.execute(sql, (user_name, password))
            user = cur.fetchone()

        if user:
            return ok("登录成功", user)
        else:
            return fail("用户名或密码错误")
    finally:
        conn.close()


# 查看用户主页
@app.route("/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT 
                u.user_id,
                u.user_name,
                u.photo,
                u.user_intro,
                u.create_at,
                COUNT(DISTINCT a.ani_id) AS anime_count,
                COUNT(DISTINCT c.char_id) AS character_count
            FROM user u
            LEFT JOIN anime_post a ON u.user_id = a.user_id
            LEFT JOIN character_post c ON u.user_id = c.user_id
            WHERE u.user_id = %s
            GROUP BY u.user_id
            """
            cur.execute(sql, (user_id,))
            user = cur.fetchone()

        if user:
            return ok("获取成功", user)
        else:
            return fail("用户不存在")
    finally:
        conn.close()


# 发布番剧
@app.route("/anime/add", methods=["POST"])
def add_anime():
    data = request.json

    user_id = data.get("user_id")
    ani_name = data.get("ani_name")
    ani_img = data.get("ani_img")
    ani_type = data.get("ani_type")
    ani_com = data.get("ani_com")

    if not user_id or not ani_name:
        return fail("用户ID和番剧名称不能为空")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO anime_post(user_id, ani_name, ani_img, ani_type, ani_com)
            VALUES(%s, %s, %s, %s, %s)
            """
            cur.execute(sql, (user_id, ani_name, ani_img, ani_type, ani_com))
            conn.commit()

        return ok("番剧发布成功")
    except Exception as e:
        return fail("番剧发布失败：" + str(e))
    finally:
        conn.close()


# 番剧列表
@app.route("/anime/list", methods=["GET"])
def anime_list():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT 
                a.ani_id,
                a.user_id,
                u.user_name,
                u.photo,
                a.ani_name,
                a.ani_img,
                a.ani_type,
                a.ani_com,
                a.create_at
            FROM anime_post a
            LEFT JOIN user u ON a.user_id = u.user_id
            ORDER BY a.ani_id DESC
            """
            cur.execute(sql)
            rows = cur.fetchall()

        return ok("获取成功", rows)
    finally:
        conn.close()


# 发布角色
@app.route("/character/add", methods=["POST"])
def add_character():
    data = request.json

    user_id = data.get("user_id")
    char_name = data.get("char_name")
    char_from = data.get("char_from")
    char_img = data.get("char_img")
    char_com = data.get("char_com")

    if not user_id or not char_name:
        return fail("用户ID和角色名称不能为空")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            INSERT INTO character_post(user_id, char_name, char_from, char_img, char_com)
            VALUES(%s, %s, %s, %s, %s)
            """
            cur.execute(sql, (user_id, char_name, char_from, char_img, char_com))
            conn.commit()

        return ok("角色发布成功")
    except Exception as e:
        return fail("角色发布失败：" + str(e))
    finally:
        conn.close()


# 角色列表
@app.route("/character/list", methods=["GET"])
def character_list():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
            SELECT 
                c.char_id,
                c.user_id,
                u.user_name,
                u.photo,
                c.char_name,
                c.char_from,
                c.char_img,
                c.char_com,
                c.create_at
            FROM character_post c
            LEFT JOIN user u ON c.user_id = u.user_id
            ORDER BY c.char_id DESC
            """
            cur.execute(sql)
            rows = cur.fetchall()

        return ok("获取成功", rows)
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)