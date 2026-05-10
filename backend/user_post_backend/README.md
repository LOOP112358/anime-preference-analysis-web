# \# 用户发布板块



## \## 项目简介



这是一个基于 Flask + MySQL 的二次元综合网站后端项目的一部分，主要实现用户发布番剧与角色卡片功能。



###### 用户可以：



\* 注册、登录账号

\* 发布自己喜欢的番剧

\* 发布自己喜欢的角色

\* 查看所有用户发布的内容

\* 查看某个用户主页

\* 修改、删除自己的卡片

\* 自动从 Bangumi 获取番剧封面、类型、角色图片



\---



## \# 技术栈



后端：



\* Python 3

\* Flask

\* Flask-CORS

\* PyMySQL

\* Requests



数据库：



\* MySQL 8



接口测试：



\* Postman / Apifox



\---

## 

## \# 项目结构





project/

│

├── app.py

├── static/

│   ├── default.jpg

│   └── default\_avatar.jpg

│

├── DB/

│   └── ani.sql

├── README.md

└── requirements.txt





\---



## \# 运行环境



推荐环境：



\* Python 3.10+

\* MySQL 8.0+

\* Windows 10 / Windows 11



\---



## \# 安装依赖



先安装 Python 依赖：



```bash

pip install flask flask-cors pymysql requests

```



或者：



```bash

pip install -r requirements.txt

```



\---



## \# 数据库配置



先创建数据库：



```sql

CREATE DATABASE anime\_web CHARACTER SET utf8mb4;

```



然后修改 `app.py` 中数据库配置：



```python

def get\_conn():

&#x20;   return pymysql.connect(

&#x20;       host="localhost",

&#x20;       user="root",

&#x20;       password="你的数据库密码",

&#x20;       database="anime\_web",

&#x20;       charset="utf8mb4",

&#x20;       cursorclass=pymysql.cursors.DictCursor

&#x20;   )

```



\---

## 

## \# 数据表结构



\## user



```sql

CREATE TABLE user(

&#x20;   user\_id INT PRIMARY KEY AUTO\_INCREMENT,

&#x20;   user\_name VARCHAR(50),

&#x20;   password VARCHAR(50),

&#x20;   photo VARCHAR(255) DEFAULT '/static/default\_avatar.jpg',

&#x20;   user\_intro VARCHAR(255),

&#x20;   create\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);

```



\## anime\_post



```sql

CREATE TABLE anime\_post(

&#x20;   ani\_id INT PRIMARY KEY AUTO\_INCREMENT,

&#x20;   user\_id INT,

&#x20;   ani\_name VARCHAR(100),

&#x20;   ani\_img TEXT,

&#x20;   ani\_type VARCHAR(255),

&#x20;   ani\_com TEXT,

&#x20;   create\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,



&#x20;   UNIQUE(user\_id, ani\_name),



&#x20;   FOREIGN KEY(user\_id) REFERENCES user(user\_id)

);

```



\## character\_post



```sql

CREATE TABLE character\_post(

&#x20;   char\_id INT PRIMARY KEY AUTO\_INCREMENT,

&#x20;   user\_id INT,

&#x20;   char\_name VARCHAR(100),

&#x20;   char\_from VARCHAR(100),

&#x20;   char\_img TEXT,

&#x20;   char\_com TEXT,

&#x20;   create\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,



&#x20;   FOREIGN KEY(user\_id) REFERENCES user(user\_id)

);

```



\---



## \# 启动项目



运行：



```bash

python app.py

```



启动成功后：



```text

http://127.0.0.1:5000

```



\---



\# 默认图片



项目需要准备：



```text

static/default.jpg

static/default\_avatar.jpg

```



其中：



\* default.jpg 用于默认番剧/角色图片

\* default\_avatar.jpg 用于默认用户头像



\---



## \# 接口说明



### \## 用户接口



\### 注册



```text

POST /register

```



\### 登录



```text

POST /login

```



\### 查看用户主页



```text

GET /user/<user\_id>

```



\---



### \## 番剧接口



\### 发布番剧



```text

POST /anime/add

```



\### 番剧列表



```text

GET /anime/list

```



\### 修改番剧



```text

POST /anime/update

```



\### 删除番剧



```text

POST /anime/delete

```



\---



### \## 角色接口



\### 发布角色



```text

POST /character/add

```



\### 角色列表



```text

GET /character/list

```



\### 修改角色



```text

POST /character/update

```



\### 删除角色



```text

POST /character/delete

```



\---



## \# 项目特点





\* RESTful 风格接口

\* JSON 返回格式统一

\* 自动获取番剧封面与类型

\* 自动获取角色图片

\* 默认图片兜底

\* 支持卡片修改与删除

\* 支持用户主页展示



\---



## \# 注意事项



1\. 所有 POST 请求均使用 JSON。



2\. Bangumi 存在模糊匹配。



如果输入不存在的番剧或角色，后端可能返回默认图。



3\. 同一个用户不能重复发布同名番剧。



4\. 图片采用网络链接形式保存。



5\. 本项目主要用于课程设计学习用途。



\---



\# 作者



Cheria



