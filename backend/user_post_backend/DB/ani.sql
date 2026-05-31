CREATE DATABASE IF NOT EXISTS anime_web
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_general_ci;

USE anime_web;

CREATE TABLE IF NOT EXISTS user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    photo VARCHAR(255) DEFAULT 'upload/default_user.jpg',
    user_intro VARCHAR(255) DEFAULT '这个人还没有写简介',
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anime_post (
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

CREATE TABLE IF NOT EXISTS character_post (
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
CREATE TABLE IF NOT EXISTS anime_favorite (
    user_id INT NOT NULL,
    ani_id INT NOT NULL,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, ani_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (ani_id) REFERENCES anime_post(ani_id)
);

CREATE TABLE IF NOT EXISTS character_favorite (
    user_id INT NOT NULL,
    char_id INT NOT NULL,
    create_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, char_id),

    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (char_id) REFERENCES character_post(char_id)
);

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