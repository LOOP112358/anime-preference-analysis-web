from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import pymysql
import requests

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3001",
                "http://127.0.0.1:3001",
            ]
        }
    },
)

DEFAULT_IMG = "/static/default.jpg"

# 图片统一上传到 backend/user_post_backend/static/
UPLOAD_FOLDER = BASE_DIR / "static"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_image(filename):
    if "." not in filename:
        return False

    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_IMAGE_EXTENSIONS


def get_db_config():
    password = os.environ.get("MYSQL_PASSWORD", "").strip()
    if not password or password == "你的数据库密码":
        raise ValueError(
            "未配置 MySQL 密码：请在 backend/user_post_backend 目录创建 .env，"
            "写入 MYSQL_PASSWORD=你的root密码（可参考 .env.example）"
        )

    return {
        "host": os.environ.get("MYSQL_HOST", "localhost"),
        "user": os.environ.get("MYSQL_USER", "root"),
        "password": password,
        "database": os.environ.get("MYSQL_DATABASE", "anime_web"),
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
    }


def get_conn():
    return pymysql.connect(**get_db_config())


def db_error_message(exc):
    if isinstance(exc, ValueError):
        return str(exc)

    if isinstance(exc, pymysql.err.OperationalError):
        code = exc.args[0] if exc.args else 0

        if code == 1045:
            return "MySQL 密码错误：请检查 .env 里的 MYSQL_PASSWORD 是否与 Workbench 登录密码一致"

        if code == 1049:
            return "数据库 anime_web 不存在：请在 MySQL Workbench 执行 DB/ani.sql"

        if code == 2003:
            return "无法连接 MySQL：请先在「服务」里启动 MySQL80（或你的 MySQL 服务）"

        return f"数据库连接失败：{exc.args[1] if len(exc.args) > 1 else exc}"

    return str(exc)


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


def get_data():
    return request.get_json(silent=True) or {}


@app.route("/health", methods=["GET"])
def health():
    try:
        conn = get_conn()
        conn.close()
        return ok("数据库连接正常")
    except Exception as exc:
        return fail(db_error_message(exc)), 503


# 上传图片：用户头像、番剧图片、角色图片都用这个接口
@app.route("/upload/image", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return fail("没有接收到图片文件，请使用 file 字段上传")

    file = request.files["file"]

    if file.filename == "":
        return fail("文件名不能为空")

    if not allowed_image(file.filename):
        return fail("图片格式不支持，只能上传 png、jpg、jpeg、gif、webp")

    old_filename = secure_filename(file.filename)
    ext = old_filename.rsplit(".", 1)[1].lower()
    new_filename = f"{uuid4().hex}.{ext}"

    save_path = UPLOAD_FOLDER / new_filename
    file.save(save_path)

    # 数据库里建议保存这个路径
    img_url = f"/static/{new_filename}"

    return ok("图片上传成功", {
        "url": img_url
    })


def is_allowed_image_proxy(url):
    try:
        from urllib.parse import urlparse
        host = urlparse(url).netloc.lower()
        return host.endswith("bgm.tv") or host.endswith("bangumi.tv")
    except Exception:
        return False


def bangumi_image_request_kwargs():
    kwargs = {
        "headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            "Referer": "https://bgm.tv/",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        "timeout": 15,
    }
    proxy_url = os.environ.get("BANGUMI_HTTPS_PROXY") or os.environ.get("HTTPS_PROXY")
    if proxy_url:
        kwargs["proxies"] = {"http": proxy_url, "https": proxy_url}
    return kwargs


@app.route("/proxy/image", methods=["GET"])
def proxy_image():
    url = request.args.get("url", "").strip()
    if url.startswith("//"):
        url = f"https:{url}"
    if not url.startswith("http") or not is_allowed_image_proxy(url):
        return fail("无效或不支持的图片地址")

    try:
        r = requests.get(url, **bangumi_image_request_kwargs())
        if r.status_code != 200:
            return fail(f"图片获取失败（HTTP {r.status_code}）")

        content_type = r.headers.get("Content-Type", "image/jpeg")
        if not content_type.startswith("image/"):
            content_type = "image/jpeg"
        return Response(
            r.content,
            mimetype=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except Exception as exc:
        return fail(f"图片代理失败：{exc}")


@app.route("/preview/anime", methods=["GET"])
def preview_anime():
    name = request.args.get("name", "").strip()
    if not name:
        return fail("番剧名称不能为空")
    limit = min(max(int(request.args.get("limit", 5)), 1), 5)
    return ok("获取成功", {"results": search_anime_candidates(name, limit)})


@app.route("/preview/character", methods=["GET"])
def preview_character():
    name = request.args.get("name", "").strip()
    if not name:
        return fail("角色名称不能为空")
    limit = min(max(int(request.args.get("limit", 5)), 1), 5)
    return ok("获取成功", {"results": search_character_candidates(name, limit)})


def extract_bangumi_image(images):
    if not images:
        return None
    return (
        images.get("large")
        or images.get("common")
        or images.get("medium")
        or images.get("small")
        or images.get("grid")
    )


def search_anime_candidates(ani_name, limit=5):
    if not ani_name:
        return []

    try:
        url = "https://api.bgm.tv/v0/search/subjects"
        body = {
            "keyword": ani_name,
            "sort": "match",
            "filter": {"type": [2]},
        }
        headers = {
            "User-Agent": "anime-web-course-project/1.0",
            "Content-Type": "application/json",
        }
        r = requests.post(url, json=body, headers=headers, timeout=8)
        if r.status_code != 200:
            return []

        results = []
        for anime in r.json().get("data", []):
            img_url = extract_bangumi_image(anime.get("images", {}))
            if not img_url:
                continue

            tags = anime.get("tags", [])
            type_list = [tag.get("name") for tag in tags[:5] if tag.get("name")]

            results.append({
                "id": anime.get("id"),
                "name": anime.get("name") or "",
                "name_cn": anime.get("name_cn") or "",
                "ani_img": img_url,
                "ani_type": ",".join(type_list) if type_list else "未知",
                "date": anime.get("date") or "",
            })

            if len(results) >= limit:
                break

        return results
    except Exception as e:
        print("搜索番剧失败：", e)
        return []


def search_character_candidates(char_name, limit=5):
    if not char_name:
        return []

    try:
        url = "https://api.bgm.tv/v0/search/characters"
        body = {
            "keyword": char_name,
            "sort": "match",
        }
        headers = {
            "User-Agent": "anime-web-course-project/1.0",
            "Content-Type": "application/json",
        }
        r = requests.post(url, json=body, headers=headers, timeout=8)
        if r.status_code != 200:
            return []

        results = []
        for char in r.json().get("data", []):
            img_url = extract_bangumi_image(char.get("images", {}))
            if not img_url:
                continue

            summary = (char.get("summary") or "").strip().replace("\n", " ")
            if len(summary) > 80:
                summary = summary[:80] + "…"

            results.append({
                "id": char.get("id"),
                "name": char.get("name") or "",
                "name_cn": char.get("name_cn") or "",
                "char_img": img_url,
                "summary": summary,
            })

            if len(results) >= limit:
                break

        return results
    except Exception as e:
        print("搜索角色失败：", e)
        return []


# 根据番剧名获取：封面 + 类型
def get_anime_info(ani_name):
    candidates = search_anime_candidates(ani_name, limit=1)
    if not candidates:
        return {"ani_img": DEFAULT_IMG, "ani_type": "未知"}
    first = candidates[0]
    return {
        "ani_img": first["ani_img"],
        "ani_type": first["ani_type"],
    }


# 根据角色名从 Bangumi 获取角色图片
def find_character_image(char_name):
    candidates = search_character_candidates(char_name, limit=1)
    if not candidates:
        return DEFAULT_IMG
    return candidates[0]["char_img"]


# 用户注册
@app.route("/register", methods=["POST"])
def register():
    data = get_data()

    user_name = data.get("user_name")
    password = data.get("password")

    if not user_name or not password:
        return fail("用户名和密码不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            INSERT INTO user(user_name, password)
            VALUES(%s, %s)
            """
            cur.execute(sql, (user_name, password))
            conn.commit()

        return ok("注册成功")

    except pymysql.err.IntegrityError:
        return fail("用户名已存在，请换一个或直接登录")

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 用户登录
@app.route("/login", methods=["POST"])
def login():
    data = get_data()

    user_name = data.get("user_name")
    password = data.get("password")

    if not user_name or not password:
        return fail("用户名和密码不能为空")

    conn = None

    try:
        conn = get_conn()
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

        return fail("用户名或密码错误")

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 查看用户主页
@app.route("/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT 
                u.user_id,
                u.user_name,
                u.photo,
                u.user_intro,
                u.create_at,
                (SELECT COUNT(*) FROM anime_post WHERE user_id = u.user_id) AS anime_count,
                (SELECT COUNT(*) FROM character_post WHERE user_id = u.user_id) AS character_count,
                (
                    (SELECT COUNT(*) FROM anime_favorite f
                     JOIN anime_post a ON f.ani_id = a.ani_id
                     WHERE a.user_id = u.user_id)
                    +
                    (SELECT COUNT(*) FROM character_favorite f
                     JOIN character_post c ON f.char_id = c.char_id
                     WHERE c.user_id = u.user_id)
                ) AS total_favorites_received
            FROM user u
            WHERE u.user_id = %s
            """
            cur.execute(sql, (user_id,))
            user = cur.fetchone()

        if user:
            return ok("获取成功", user)

        return fail("用户不存在")

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 修改个人信息：用户名、密码、头像、简介
@app.route("/user/update", methods=["POST"])
def update_user():
    data = get_data()

    user_id = data.get("user_id")
    user_name = data.get("user_name")
    password = data.get("password")
    photo = data.get("photo")
    user_intro = data.get("user_intro")

    if not user_id:
        return fail("用户ID不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT user_id, user_name, password, photo, user_intro, create_at
            FROM user
            WHERE user_id=%s
            """
            cur.execute(sql, (user_id,))
            old_user = cur.fetchone()

            if not old_user:
                return fail("用户不存在")

            if not user_name:
                user_name = old_user["user_name"]

            if not password:
                password = old_user["password"]

            if not photo:
                photo = old_user["photo"]

            if user_intro is None:
                user_intro = old_user["user_intro"]

            sql = """
            UPDATE user
            SET user_name=%s,
                password=%s,
                photo=%s,
                user_intro=%s
            WHERE user_id=%s
            """
            cur.execute(sql, (user_name, password, photo, user_intro, user_id))
            conn.commit()

            sql = """
            SELECT user_id, user_name, photo, user_intro, create_at
            FROM user
            WHERE user_id=%s
            """
            cur.execute(sql, (user_id,))
            new_user = cur.fetchone()

        return ok("个人信息修改成功", new_user)

    except pymysql.err.IntegrityError:
        return fail("用户名已存在，请换一个用户名")

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 发布番剧
@app.route("/anime/add", methods=["POST"])
def add_anime():
    data = get_data()

    user_id = data.get("user_id")
    ani_name = data.get("ani_name")
    ani_img = data.get("ani_img")
    ani_type = data.get("ani_type")
    ani_com = data.get("ani_com")

    if not user_id or not ani_name:
        return fail("用户ID和番剧名称不能为空")

    anime_info = get_anime_info(ani_name)

    if not ani_img:
        ani_img = anime_info["ani_img"]

    if not ani_type:
        ani_type = anime_info["ani_type"]

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            INSERT INTO anime_post(user_id, ani_name, ani_img, ani_type, ani_com)
            VALUES(%s, %s, %s, %s, %s)
            """
            cur.execute(sql, (user_id, ani_name, ani_img, ani_type, ani_com))
            conn.commit()

        return ok("番剧发布成功", {
            "ani_name": ani_name,
            "ani_img": ani_img,
            "ani_type": ani_type,
            "ani_com": ani_com
        })

    except pymysql.err.IntegrityError:
        return fail("你已经发布过这个番剧了，不能重复发布")

    except Exception as e:
        return fail("番剧发布失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 番剧列表
@app.route("/anime/list", methods=["GET"])
def anime_list():
    conn = None

    try:
        conn = get_conn()
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
                a.create_at,
                (SELECT COUNT(*) FROM anime_favorite f WHERE f.ani_id = a.ani_id) AS favorite_count
            FROM anime_post a
            LEFT JOIN user u ON a.user_id = u.user_id
            ORDER BY a.ani_id DESC
            """
            cur.execute(sql)
            rows = cur.fetchall()

        return ok("获取成功", rows)

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 修改番剧：支持修改番剧名、图片、类型、评价，也支持 reset_img 恢复抓取图片
@app.route("/anime/update", methods=["POST"])
def update_anime():
    data = get_data()

    ani_id = data.get("ani_id")
    user_id = data.get("user_id")
    ani_name = data.get("ani_name")
    ani_img = data.get("ani_img")
    ani_type = data.get("ani_type")
    ani_com = data.get("ani_com")
    reset_img = data.get("reset_img")

    if not ani_id or not user_id:
        return fail("番剧ID和用户ID不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT ani_name, ani_img, ani_type, ani_com
            FROM anime_post
            WHERE ani_id=%s AND user_id=%s
            """
            cur.execute(sql, (ani_id, user_id))
            old = cur.fetchone()

            if not old:
                return fail("修改失败，可能不是你的番剧卡片")

            if not ani_name:
                ani_name = old["ani_name"]

            if reset_img:
                anime_info = get_anime_info(ani_name)
                ani_img = anime_info["ani_img"]
            elif not ani_img:
                ani_img = old["ani_img"]

            if not ani_type:
                ani_type = old["ani_type"]

            if ani_com is None:
                ani_com = old["ani_com"]

            sql = """
            UPDATE anime_post
            SET ani_name=%s,
                ani_img=%s,
                ani_type=%s,
                ani_com=%s
            WHERE ani_id=%s AND user_id=%s
            """
            cur.execute(sql, (ani_name, ani_img, ani_type, ani_com, ani_id, user_id))
            conn.commit()

        return ok("番剧修改成功", {
            "ani_id": ani_id,
            "ani_name": ani_name,
            "ani_img": ani_img,
            "ani_type": ani_type,
            "ani_com": ani_com
        })

    except pymysql.err.IntegrityError:
        return fail("修改失败：你已经有同名番剧卡片了")

    except Exception as e:
        return fail("番剧修改失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 删除番剧
@app.route("/anime/delete", methods=["POST"])
def delete_anime():
    data = get_data()

    ani_id = data.get("ani_id")
    user_id = data.get("user_id")

    if not ani_id or not user_id:
        return fail("番剧ID和用户ID不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            DELETE FROM anime_post
            WHERE ani_id=%s AND user_id=%s
            """
            cur.execute(sql, (ani_id, user_id))
            conn.commit()

            if cur.rowcount == 0:
                return fail("删除失败，可能不是你的番剧卡片")

        return ok("番剧删除成功")

    except Exception as e:
        return fail("番剧删除失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 发布角色
@app.route("/character/add", methods=["POST"])
def add_character():
    data = get_data()

    user_id = data.get("user_id")
    char_name = data.get("char_name")
    char_from = data.get("char_from")
    char_img = data.get("char_img")
    char_com = data.get("char_com")

    if not user_id or not char_name:
        return fail("用户ID和角色名称不能为空")

    if not char_img:
        char_img = find_character_image(char_name)

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            INSERT INTO character_post(user_id, char_name, char_from, char_img, char_com)
            VALUES(%s, %s, %s, %s, %s)
            """
            cur.execute(sql, (user_id, char_name, char_from, char_img, char_com))
            conn.commit()

        return ok("角色发布成功", {
            "char_name": char_name,
            "char_from": char_from,
            "char_img": char_img,
            "char_com": char_com
        })

    except pymysql.err.IntegrityError:
        return fail("你已经发布过这个角色了，不能重复发布")

    except Exception as e:
        return fail("角色发布失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 角色列表
@app.route("/character/list", methods=["GET"])
def character_list():
    conn = None

    try:
        conn = get_conn()
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
                c.create_at,
                (SELECT COUNT(*) FROM character_favorite f WHERE f.char_id = c.char_id) AS favorite_count
            FROM character_post c
            LEFT JOIN user u ON c.user_id = u.user_id
            ORDER BY c.char_id DESC
            """
            cur.execute(sql)
            rows = cur.fetchall()

        return ok("获取成功", rows)

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 修改角色：支持修改角色名、出处、图片、评价，也支持 reset_img 恢复抓取图片
@app.route("/character/update", methods=["POST"])
def update_character():
    data = get_data()

    char_id = data.get("char_id")
    user_id = data.get("user_id")
    char_name = data.get("char_name")
    char_from = data.get("char_from")
    char_img = data.get("char_img")
    char_com = data.get("char_com")
    reset_img = data.get("reset_img")

    if not char_id or not user_id:
        return fail("角色ID和用户ID不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT char_name, char_from, char_img, char_com
            FROM character_post
            WHERE char_id=%s AND user_id=%s
            """
            cur.execute(sql, (char_id, user_id))
            old = cur.fetchone()

            if not old:
                return fail("修改失败，可能不是你的角色卡片")

            if not char_name:
                char_name = old["char_name"]

            if not char_from:
                char_from = old["char_from"]

            if reset_img:
                char_img = find_character_image(char_name)
            elif not char_img:
                char_img = old["char_img"]

            if char_com is None:
                char_com = old["char_com"]

            sql = """
            UPDATE character_post
            SET char_name=%s,
                char_from=%s,
                char_img=%s,
                char_com=%s
            WHERE char_id=%s AND user_id=%s
            """
            cur.execute(sql, (char_name, char_from, char_img, char_com, char_id, user_id))
            conn.commit()

        return ok("角色修改成功", {
            "char_id": char_id,
            "char_name": char_name,
            "char_from": char_from,
            "char_img": char_img,
            "char_com": char_com
        })

    except pymysql.err.IntegrityError:
        return fail("修改失败：你已经有同名角色卡片了")

    except Exception as e:
        return fail("角色修改失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 删除角色
@app.route("/character/delete", methods=["POST"])
def delete_character():
    data = get_data()

    char_id = data.get("char_id")
    user_id = data.get("user_id")

    if not char_id or not user_id:
        return fail("角色ID和用户ID不能为空")

    conn = None

    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            DELETE FROM character_post
            WHERE char_id=%s AND user_id=%s
            """
            cur.execute(sql, (char_id, user_id))
            conn.commit()

            if cur.rowcount == 0:
                return fail("删除失败，可能不是你的角色卡片")

        return ok("角色删除成功")

    except Exception as e:
        return fail("角色删除失败：" + str(e))

    finally:
        if conn:
            conn.close()


# 查看某个用户发布的番剧
@app.route("/user/<int:user_id>/anime", methods=["GET"])
def user_anime_list(user_id):
    conn = None

    try:
        conn = get_conn()
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
                a.create_at,
                (SELECT COUNT(*) FROM anime_favorite f WHERE f.ani_id = a.ani_id) AS favorite_count
            FROM anime_post a
            LEFT JOIN user u ON a.user_id = u.user_id
            WHERE a.user_id=%s
            ORDER BY a.ani_id DESC
            """
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()

        return ok("获取成功", rows)

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# 查看某个用户发布的角色
@app.route("/user/<int:user_id>/character", methods=["GET"])
def user_character_list(user_id):
    conn = None

    try:
        conn = get_conn()
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
                c.create_at,
                (SELECT COUNT(*) FROM character_favorite f WHERE f.char_id = c.char_id) AS favorite_count
            FROM character_post c
            LEFT JOIN user u ON c.user_id = u.user_id
            WHERE c.user_id=%s
            ORDER BY c.char_id DESC
            """
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()

        return ok("获取成功", rows)

    except Exception as exc:
        return fail(db_error_message(exc))

    finally:
        if conn:
            conn.close()


# ----------------- 收藏相关接口 -----------------

# 收藏番剧
@app.route("/favorite/anime/add", methods=["POST"])
def favorite_anime_add():
    data = get_data()
    user_id = data.get("user_id")
    ani_id = data.get("ani_id")

    if not user_id or not ani_id:
        return fail("用户ID和番剧ID不能为空")

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = "INSERT INTO anime_favorite(user_id, ani_id) VALUES(%s, %s)"
            cur.execute(sql, (user_id, ani_id))
            conn.commit()
        return ok("番剧收藏成功")
    except pymysql.err.IntegrityError:
        return fail("你已经收藏过这个番剧了")
    except Exception as e:
        return fail(f"收藏失败：{e}")
    finally:
        if conn:
            conn.close()


# 取消收藏番剧
@app.route("/favorite/anime/delete", methods=["POST"])
def favorite_anime_delete():
    data = get_data()
    user_id = data.get("user_id")
    ani_id = data.get("ani_id")

    if not user_id or not ani_id:
        return fail("用户ID和番剧ID不能为空")

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = "DELETE FROM anime_favorite WHERE user_id=%s AND ani_id=%s"
            cur.execute(sql, (user_id, ani_id))
            conn.commit()
        return ok("取消收藏成功")
    except Exception as e:
        return fail(f"取消收藏失败：{e}")
    finally:
        if conn:
            conn.close()


# 收藏角色
@app.route("/favorite/character/add", methods=["POST"])
def favorite_character_add():
    data = get_data()
    user_id = data.get("user_id")
    char_id = data.get("char_id")

    if not user_id or not char_id:
        return fail("用户ID和角色ID不能为空")

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = "INSERT INTO character_favorite(user_id, char_id) VALUES(%s, %s)"
            cur.execute(sql, (user_id, char_id))
            conn.commit()
        return ok("角色收藏成功")
    except pymysql.err.IntegrityError:
        return fail("你已经收藏过这个角色了")
    except Exception as e:
        return fail(f"收藏失败：{e}")
    finally:
        if conn:
            conn.close()


# 取消收藏角色
@app.route("/favorite/character/delete", methods=["POST"])
def favorite_character_delete():
    data = get_data()
    user_id = data.get("user_id")
    char_id = data.get("char_id")

    if not user_id or not char_id:
        return fail("用户ID和角色ID不能为空")

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = "DELETE FROM character_favorite WHERE user_id=%s AND char_id=%s"
            cur.execute(sql, (user_id, char_id))
            conn.commit()
        return ok("取消收藏成功")
    except Exception as e:
        return fail(f"取消收藏失败：{e}")
    finally:
        if conn:
            conn.close()


# 查看用户收藏的番剧列表
@app.route("/user/<int:user_id>/favorite/anime", methods=["GET"])
def favorite_anime_list(user_id):
    conn = None
    try:
        conn = get_conn()
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
                a.create_at,
                (SELECT COUNT(*) FROM anime_favorite f2 WHERE f2.ani_id = a.ani_id) AS favorite_count
            FROM anime_post a
            JOIN anime_favorite f ON a.ani_id = f.ani_id
            LEFT JOIN user u ON a.user_id = u.user_id
            WHERE f.user_id=%s
            ORDER BY f.create_at DESC
            """
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()
        return ok("获取成功", rows)
    except Exception as e:
        return fail(f"获取失败：{e}")
    finally:
        if conn:
            conn.close()


# 查看用户收藏的角色列表
@app.route("/user/<int:user_id>/favorite/character", methods=["GET"])
def favorite_character_list(user_id):
    conn = None
    try:
        conn = get_conn()
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
                c.create_at,
                (SELECT COUNT(*) FROM character_favorite f2 WHERE f2.char_id = c.char_id) AS favorite_count
            FROM character_post c
            JOIN character_favorite f ON c.char_id = f.char_id
            LEFT JOIN user u ON c.user_id = u.user_id
            WHERE f.user_id=%s
            ORDER BY f.create_at DESC
            """
            cur.execute(sql, (user_id,))
            rows = cur.fetchall()
        return ok("获取成功", rows)
    except Exception as e:
        return fail(f"获取失败：{e}")
    finally:
        if conn:
            conn.close()
# 查看收藏某条番剧的用户列表
@app.route("/anime/<int:ani_id>/favorite/users", methods=["GET"])
def anime_favorite_users(ani_id):
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT
                u.user_id,
                u.user_name,
                u.photo,
                f.create_at
            FROM anime_favorite f
            JOIN user u ON f.user_id = u.user_id
            WHERE f.ani_id = %s
            ORDER BY f.create_at DESC
            """
            cur.execute(sql, (ani_id,))
            rows = cur.fetchall()
        return ok("获取成功", rows)
    except Exception as e:
        return fail(f"获取失败：{e}")
    finally:
        if conn:
            conn.close()


# 查看收藏某条角色的用户列表
@app.route("/character/<int:char_id>/favorite/users", methods=["GET"])
def character_favorite_users(char_id):
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            sql = """
            SELECT
                u.user_id,
                u.user_name,
                u.photo,
                f.create_at
            FROM character_favorite f
            JOIN user u ON f.user_id = u.user_id
            WHERE f.char_id = %s
            ORDER BY f.create_at DESC
            """
            cur.execute(sql, (char_id,))
            rows = cur.fetchall()
        return ok("获取成功", rows)
    except Exception as e:
        return fail(f"获取失败：{e}")
    finally:
        if conn:
            conn.close()


            
if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)