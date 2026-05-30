import time
import requests
from io import BytesIO

BASE_URL = "http://47.86.228.151:5000"

USERS = [
    {
        "user_name": "sakura_test",
        "password": "123456",
        "intro": "喜欢校园、治愈和温柔的故事。",
        "anime": [
            ("CLANNAD", "人生番，情感很真。"),
            ("夏目友人帐", "温柔治愈。"),
            ("魔卡少女樱", "童年经典。"),
        ],
        "characters": [
            ("木之本樱", "魔卡少女樱", "可爱又勇敢。"),
            ("夏目贵志", "夏目友人帐", "温柔的人。"),
            ("古河渚", "CLANNAD", "很让人心疼。"),
        ],
    },
    {
        "user_name": "kirito_test",
        "password": "123456",
        "intro": "喜欢战斗和冒险类番剧。",
        "anime": [
            ("刀剑神域", "异世界战斗经典。"),
            ("进击的巨人", "剧情压迫感很强。"),
            ("鬼灭之刃", "画面和情绪都很燃。"),
        ],
        "characters": [
            ("桐谷和人", "刀剑神域", "黑衣剑士。"),
            ("艾伦·耶格尔", "进击的巨人", "复杂的主角。"),
            ("灶门炭治郎", "鬼灭之刃", "温柔又坚定。"),
        ],
    },
    {
        "user_name": "rem_test",
        "password": "123456",
        "intro": "喜欢异世界和人气角色。",
        "anime": [
            ("Re:从零开始的异世界生活", "剧情反转很多。"),
            ("无职转生", "异世界制作精良。"),
            ("为美好的世界献上祝福！", "轻松搞笑。"),
        ],
        "characters": [
            ("蕾姆", "Re:从零开始的异世界生活", "人气很高。"),
            ("洛琪希", "无职转生", "很有魅力。"),
            ("惠惠", "为美好的世界献上祝福！", "爆裂魔法！"),
        ],
    },
    {
        "user_name": "frieren_test",
        "password": "123456",
        "intro": "喜欢慢节奏、细腻情感作品。",
        "anime": [
            ("葬送的芙莉莲", "安静但后劲足。"),
            ("紫罗兰永恒花园", "画面和情感都很美。"),
            ("狼与香辛料", "氛围很好。"),
        ],
        "characters": [
            ("芙莉莲", "葬送的芙莉莲", "淡淡的温柔。"),
            ("薇尔莉特·伊芙加登", "紫罗兰永恒花园", "成长很动人。"),
            ("赫萝", "狼与香辛料", "贤狼很可爱。"),
        ],
    },
    {
        "user_name": "conan_test",
        "password": "123456",
        "intro": "推理番爱好者。",
        "anime": [
            ("名侦探柯南", "经典推理番。"),
            ("死亡笔记", "智斗很精彩。"),
            ("冰菓", "日常推理很舒服。"),
        ],
        "characters": [
            ("江户川柯南", "名侦探柯南", "真相只有一个。"),
            ("夜神月", "死亡笔记", "高智商角色。"),
            ("折木奉太郎", "冰菓", "节能主义者。"),
        ],
    },
    {
        "user_name": "sports_test",
        "password": "123456",
        "intro": "热血运动番爱好者。",
        "anime": [
            ("排球少年！！", "团队感很强。"),
            ("黑子的篮球", "热血篮球番。"),
            ("灌篮高手", "永远的经典。"),
        ],
        "characters": [
            ("日向翔阳", "排球少年！！", "小巨人。"),
            ("黑子哲也", "黑子的篮球", "存在感很低但很强。"),
            ("樱木花道", "灌篮高手", "天才篮板王。"),
        ],
    },
    {
        "user_name": "music_test",
        "password": "123456",
        "intro": "喜欢音乐、青春和成长题材。",
        "anime": [
            ("轻音少女", "轻松可爱。"),
            ("四月是你的谎言", "音乐和青春的遗憾。"),
            ("孤独摇滚！", "社恐少女的乐队梦。"),
        ],
        "characters": [
            ("平泽唯", "轻音少女", "天然可爱。"),
            ("宫园薰", "四月是你的谎言", "自由又耀眼。"),
            ("后藤一里", "孤独摇滚！", "波奇酱。"),
        ],
    },
    {
        "user_name": "mecha_test",
        "password": "123456",
        "intro": "喜欢机甲和科幻作品。",
        "anime": [
            ("新世纪福音战士", "经典机甲神作。"),
            ("天元突破 红莲螺岩", "燃到极致。"),
            ("Code Geass 反叛的鲁路修", "剧情很强。"),
        ],
        "characters": [
            ("碇真嗣", "新世纪福音战士", "复杂的少年。"),
            ("西蒙", "天元突破 红莲螺岩", "成长型主角。"),
            ("鲁路修·兰佩路基", "Code Geass 反叛的鲁路修", "智斗型主角。"),
        ],
    },
    {
        "user_name": "daily_test",
        "password": "123456",
        "intro": "喜欢日常和轻松搞笑作品。",
        "anime": [
            ("男子高中生的日常", "非常搞笑。"),
            ("日常", "荒诞又可爱。"),
            ("干物妹！小埋", "轻松下饭。"),
        ],
        "characters": [
            ("田畑秀则", "男子高中生的日常", "日常吐槽担当。"),
            ("东云名乃", "日常", "很可爱。"),
            ("土间埋", "干物妹！小埋", "反差萌。"),
        ],
    },
    {
        "user_name": "shounen_test",
        "password": "123456",
        "intro": "少年漫和长篇热血番爱好者。",
        "anime": [
            ("海贼王", "冒险和伙伴。"),
            ("火影忍者", "热血成长。"),
            ("死神", "战斗很帅。"),
        ],
        "characters": [
            ("蒙奇·D·路飞", "海贼王", "我要成为海贼王。"),
            ("漩涡鸣人", "火影忍者", "永不放弃。"),
            ("黑崎一护", "死神", "代理死神。"),
        ],
    },
]


def post_json(path, data):
    try:
        r = requests.post(BASE_URL + path, json=data, timeout=40)
        return r.json()
    except Exception as e:
        return {"success": False, "message": str(e)}


def get_json(path):
    try:
        r = requests.get(BASE_URL + path, timeout=40)
        return r.json()
    except Exception as e:
        return {"success": False, "message": str(e)}


def upload_avatar(user_name, retries=3):
    avatar_url = f"https://robohash.org/{user_name}.png?set=set4&size=300x300"

    for i in range(retries):
        try:
            img = requests.get(avatar_url, timeout=30)
            img.raise_for_status()

            files = {
                "file": (
                    f"{user_name}.png",
                    BytesIO(img.content),
                    "image/png",
                )
            }

            result = requests.post(
                BASE_URL + "/upload/image",
                files=files,
                timeout=40
            ).json()

            if result.get("success"):
                return result["data"]["url"]

            print(f"[头像上传失败] {user_name}: {result.get('message')}")

        except Exception as e:
            print(f"[头像异常] {user_name} 第 {i + 1} 次失败: {e}")
            time.sleep(2)

    return None


def register_and_login(user):
    register_result = post_json("/register", {
        "user_name": user["user_name"],
        "password": user["password"],
    })

    print(f"[注册] {user['user_name']}: {register_result.get('message')}")

    login_result = post_json("/login", {
        "user_name": user["user_name"],
        "password": user["password"],
    })

    if login_result.get("success"):
        return login_result["data"]

    print(f"[登录失败] {user['user_name']}: {login_result.get('message')}")
    return None


def update_user_profile(user_id, user):
    photo = upload_avatar(user["user_name"])

    data = {
        "user_id": user_id,
        "user_name": user["user_name"],
        "password": user["password"],
        "user_intro": user["intro"],
    }

    if photo:
        data["photo"] = photo

    result = post_json("/user/update", data)
    print(f"[资料更新] {user['user_name']}: {result.get('message')}")


def add_anime(user_id, user):
    for ani_name, ani_com in user["anime"]:
        result = post_json("/anime/add", {
            "user_id": user_id,
            "ani_name": ani_name,
            "ani_com": ani_com,
        })

        print(f"[番剧] {user['user_name']} -> {ani_name}: {result.get('message')}")
        time.sleep(0.8)


def add_character(user_id, user):
    for char_name, char_from, char_com in user["characters"]:
        result = post_json("/character/add", {
            "user_id": user_id,
            "char_name": char_name,
            "char_from": char_from,
            "char_com": char_com,
        })

        print(f"[角色] {user['user_name']} -> {char_name}: {result.get('message')}")
        time.sleep(0.8)


def main():
    health = get_json("/health")
    if not health.get("success"):
        print("[后端异常]", health.get("message"))
        return

    print("[后端正常]", health.get("message"))

    for user in USERS:
        print("\n==============================")
        print("开始处理：", user["user_name"])

        db_user = register_and_login(user)
        if not db_user:
            continue

        user_id = db_user["user_id"]

        update_user_profile(user_id, user)
        add_anime(user_id, user)
        add_character(user_id, user)

    print("\n全部完成。")


if __name__ == "__main__":
    main()