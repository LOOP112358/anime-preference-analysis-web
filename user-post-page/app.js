// 后端接口地址（自行修改）
const API = {
  login: "/api/login",
  userInfo: "/api/user/info",
  animeList: "/api/anime/list",
  charList: "/api/char/list",
  publishAnime: "/api/anime/publish",
  publishChar: "/api/char/publish"
};

// 本地存储Token
function setToken(t) { localStorage.setItem("token", t); }
function getToken() { return localStorage.getItem("token"); }
function clearToken() { localStorage.removeItem("token"); }

// 请求头
function getHeader() {
  return {
    "Content-Type": "application/json",
    "token": getToken() || ""
  };
}

// 登录
async function login(username, password) {
  const res = await fetch(API.login, {
    method: "POST",
    headers: getHeader(),
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (json.success) {
    setToken(json.data.token);
    return true;
  } else {
    alert(json.message || "登录失败");
    return false;
  }
}

// 加载用户信息
async function loadUserInfo() {
  const res = await fetch(API.userInfo, { headers: getHeader() });
  const json = await res.json();
  if (!json.success) return;
  const u = json.data;
  document.getElementById("avatar").src = u.photo;
  document.getElementById("nickname").innerText = u.user_name;
  document.getElementById("usernameShow").innerText = u.user_name;
  document.getElementById("userIdShow").innerText = u.user_id;
  document.getElementById("introShow").innerText = u.user_intro;
}

// 加载番剧列表
async function loadAnimeList() {
  const res = await fetch(API.animeList, { headers: getHeader() });
  const json = await res.json();
  if (!json.success) return;
  const list = json.data;
  let html = "";
  list.forEach(item => {
    html += `
    <div class="card">
      <img src="${item.ani_img}" alt="">
      <div class="card-body">
        <h3>${item.ani_name}</h3>
        <div class="meta">类型：${item.ani_type}</div>
        <div class="com">${item.ani_com}</div>
      </div>
    </div>
    `;
  });
  document.getElementById("animeList").innerHTML = html;
}

// 加载角色列表
async function loadCharList() {
  const res = await fetch(API.charList, { headers: getHeader() });
  const json = await res.json();
  if (!json.success) return;
  const list = json.data;
  let html = "";
  list.forEach(item => {
    html += `
    <div class="card">
      <img src="${item.char_img}" alt="">
      <div class="card-body">
        <h3>${item.char_name}</h3>
        <div class="meta">出自：${item.char_from}</div>
        <div class="com">${item.char_com}</div>
      </div>
    </div>
    `;
  });
  document.getElementById("charList").innerHTML = html;
  document.getElementById("profileCharList").innerHTML = html;
}

// 退出登录
function logout() {
  clearToken();
  location.reload();
}

// 左侧菜单切换
function initMenu() {
  const menuItems = document.querySelectorAll(".menu-item");
  const pages = document.querySelectorAll(".page");

  menuItems.forEach(item => {
    item.onclick = function() {
      menuItems.forEach(i => i.classList.remove("active"));
      this.classList.add("active");
      const target = this.dataset.page;
      pages.forEach(p => p.classList.remove("active"));
      document.getElementById("page-" + target).classList.add("active");
    }
  });
}

// 发布弹窗控制
function initModal() {
  const modal = document.getElementById("publishModal");
  const closeBtn = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");
  const pubType = document.getElementById("pubType");
  const submitBtn = document.getElementById("submitBtn");

  // 发布番剧按钮
  document.getElementById("publishAnimeBtn").onclick = () => {
    modalTitle.innerText = "发布新番剧";
    pubType.style.display = "block";
    pubType.placeholder = "类型（如：校园,音乐）";
    modal.style.display = "flex";
    submitBtn.onclick = submitAnime;
  };

  // 发布角色按钮
  document.getElementById("publishCharBtn").onclick = () => {
    modalTitle.innerText = "发布新角色";
    pubType.style.display = "block";
    pubType.placeholder = "出处番剧";
    modal.style.display = "flex";
    submitBtn.onclick = submitChar;
  };

  // 我的主页发布按钮（默认发布角色）
  document.getElementById("publishBtn").onclick = () => {
    modalTitle.innerText = "发布新角色";
    pubType.style.display = "block";
    pubType.placeholder = "出处番剧";
    modal.style.display = "flex";
    submitBtn.onclick = submitChar;
  };

  // 关闭弹窗
  closeBtn.onclick = () => {
    modal.style.display = "none";
    document.getElementById("pubName").value = "";
    document.getElementById("pubType").value = "";
    document.getElementById("pubCom").value = "";
  };
}

// 提交番剧
async function submitAnime() {
  const name = document.getElementById("pubName").value.trim();
  const type = document.getElementById("pubType").value.trim();
  const com = document.getElementById("pubCom").value.trim();
  if (!name || !com) return alert("请填写番剧名称和评价");

  const res = await fetch(API.publishAnime, {
    method: "POST",
    headers: getHeader(),
    body: JSON.stringify({ ani_name: name, ani_type: type, ani_com: com })
  });
  const json = await res.json();
  if (json.success) {
    alert("发布成功");
    document.getElementById("publishModal").style.display = "none";
    loadAnimeList();
  } else {
    alert(json.message);
  }
}

// 提交角色
async function submitChar() {
  const name = document.getElementById("pubName").value.trim();
  const from = document.getElementById("pubType").value.trim();
  const com = document.getElementById("pubCom").value.trim();
  if (!name || !from || !com) return alert("请填写完整信息");

  const res = await fetch(API.publishChar, {
    method: "POST",
    headers: getHeader(),
    body: JSON.stringify({ char_name: name, char_from: from, char_com: com })
  });
  const json = await res.json();
  if (json.success) {
    alert("发布成功");
    document.getElementById("publishModal").style.display = "none";
    loadCharList();
  } else {
    alert(json.message);
  }
}

// 页面初始化
async function init() {
  initMenu();
  initModal();

  if (!getToken()) {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainLayout").style.display = "none";
    return;
  }

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("mainLayout").style.display = "block";

  await loadUserInfo();
  await loadAnimeList();
  await loadCharList();
}

// 绑定事件
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").onclick = async () => {
    const u = document.getElementById("username").value;
    const p = document.getElementById("password").value;
    const ok = await login(u, p);
    if (ok) location.reload();
  };

  document.getElementById("logoutBtn").onclick = logout;

  init();
});