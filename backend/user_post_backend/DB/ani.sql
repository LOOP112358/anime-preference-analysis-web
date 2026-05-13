CREATE DATABASE IF NOT EXISTS anime_web
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_general_ci;

USE anime_web;

CREATE TABLE user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    photo VARCHAR(255) DEFAULT 'upload/default_user.jpg',
    user_intro VARCHAR(255) DEFAULT '这个人还没有写简介',
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anime_post (
    ani_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ani_name VARCHAR(100) NOT NULL,
    ani_img VARCHAR(255) DEFAULT 'upload/default_anime.jpg',
    ani_type VARCHAR(100),
    ani_com VARCHAR(255),
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(user_id),
    UNIQUE(user_id, ani_name)
);

CREATE TABLE character_post (
    char_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    char_name VARCHAR(100) NOT NULL,
    char_from VARCHAR(100),
    char_img VARCHAR(255) DEFAULT 'upload/default_character.jpg',
    char_com VARCHAR(255),
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user(user_id),
    UNIQUE(user_id, char_name)
);
INSERT INTO user(user_name, password, photo, user_intro)
VALUES
('Cheria', '123456', 'upload/me.jpg', '喜欢日常系和轻百合'),
('小明', '123456', 'upload/a.jpg', '喜欢热血番');

INSERT INTO anime_post(user_id, ani_name, ani_img, ani_type, ani_com)
VALUES
(1, '孤独摇滚', 'upload/bocchi.jpg', '校园,音乐,日常', '波奇酱太真实了'),
(2, '孤独摇滚', 'upload/bocchi2.jpg', '校园,音乐,日常', '我也很喜欢这部番'),
(1, '轻音少女', 'upload/k-on.jpg', '音乐,日常', '很温暖的日常番');

INSERT INTO character_post(user_id, char_name, char_from, char_img, char_com)
VALUES
(1, '后藤一里', '孤独摇滚', 'upload/bocchi_role.jpg', '社恐人圣经'),
(2, '后藤一里', '孤独摇滚', 'upload/bocchi_role2.jpg', '很可爱'),
(1, '平泽唯', '轻音少女', 'upload/yui.jpg', '天然呆很可爱');
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
JOIN user u ON a.user_id = u.user_id
ORDER BY a.ani_id DESC;
ALTER TABLE user
MODIFY photo VARCHAR(255)
DEFAULT '/static/default_avatar.jpg';
UPDATE user
SET photo = '/static/default_avatar.jpg'
WHERE photo IS NULL OR photo = '';