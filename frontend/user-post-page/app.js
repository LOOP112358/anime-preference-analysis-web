const API = "http://127.0.0.1:5001";

const uid = () => localStorage.getItem("user_id") || "";
const setUser = (d) => {
  localStorage.setItem("user_id", d.user_id);
  localStorage.setItem("user_name", d.user_name);
  localStorage.setItem("photo", d.photo || "");
  localStorage.setItem("intro", d.user_intro || "");
};
const header = () => ({ "Content-Type": "application/json" });

let currentPublishType = ""; // anime / char

function initMenu() {
  const mi = document.querySelectorAll(".menu-item");
  const pg = document.querySelectorAll(".page");
  mi.forEach((m, i) => {
    m.onclick = () => {
      mi.forEach(x => x.classList.remove("active"));
      pg.forEach(x => x.classList.remove("active"));
      m.classList.add("active");
      pg[i].classList.add("active");
    };
  });
}

async function loadProfile() {
  const user_id = uid();
  if (!user_id) return;
  document.getElementById("userIdShow").innerText = user_id;
  document.getElementById("usernameShow").innerText = localStorage.getItem("user_name");
  document.getElementById("introShow").innerText = localStorage.getItem("intro") || "";
  document.getElementById("avatar").src = localStorage.getItem("photo") || "/static/default.jpg";
  loadUserCards(user_id);
}

// ==============================================
// 发布弹窗（增加图片输入 + 裁剪）
// ==============================================
function initModal() {
  const modal = document.getElementById("publishModal");
  const close = document.getElementById("closeModal");
  const title = document.getElementById("modalTitle");
  const extra = document.getElementById("pubExtra");
  const imgWrap = document.getElementById("pubImageWrap");
  const imgInput = document.getElementById("pubImage");
  const submit = document.getElementById("submitBtn");

  close.onclick = () => { modal.style.display = "none"; };

  // 发布番剧
  document.getElementById("publishAnimeBtn").onclick = () => {
    currentPublishType = "anime";
    title.innerText = "发布番剧";
    extra.placeholder = "类型（可选）";
    extra.style.display = "block";
    imgWrap.style.display = "block";
    imgInput.placeholder = "图片链接（可选，不填则自动抓取）";
    modal.style.display = "flex";
    submit.onclick = postAnime;
  };

  // 发布角色
  document.getElementById("publishBtn").onclick =
  document.getElementById("publishCharBtn").onclick = () => {
    currentPublishType = "char";
    title.innerText = "发布角色";
    extra.placeholder = "出处番剧";
    extra.style.display = "block";
    imgWrap.style.display = "block";
    imgInput.placeholder = "角色图片链接（可选）";
    modal.style.display = "flex";
    submit.onclick = postChar;
  };
}

// 登录
async function login() {
  const user_name = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (!user_name || !password) return alert("不能为空");
  const res = await fetch(API + "/login", {
    method: "POST", headers: header(),
    body: JSON.stringify({ user_name, password })
  });
  const j = await res.json();
  if (j.success) {
    setUser(j.data);
    location.reload();
  } else {
    alert(j.message);
  }
}

// 注册
async function register() {
  const user_name = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (!user_name || !password) return alert("不能为空");
  const res = await fetch(API + "/register", {
    method: "POST", headers: header(),
    body: JSON.stringify({ user_name, password })
  });
  const j = await res.json();
  alert(j.message);
}

// 发布番剧（支持自定义图片）
async function postAnime() {
  const ani_name = document.getElementById("pubName").value.trim();
  const ani_type = document.getElementById("pubExtra").value.trim();
  const ani_img = document.getElementById("pubImage").value.trim();
  const ani_com = document.getElementById("pubCom").value.trim();
  if (!ani_name) return alert("请输入番剧名称");

  const res = await fetch(API + "/anime/add", {
    method: "POST", headers: header(),
    body: JSON.stringify({
      user_id: uid(),
      ani_name,
      ani_type,
      ani_img,
      ani_com
    })
  });
  const j = await res.json();
  alert(j.message);
  if (j.success) {
    document.getElementById("publishModal").style.display = "none";
    loadAnime();
  }
}

// 发布角色（支持自定义图片）
async function postChar() {
  const char_name = document.getElementById("pubName").value.trim();
  const char_from = document.getElementById("pubExtra").value.trim();
  const char_img = document.getElementById("pubImage").value.trim();
  const char_com = document.getElementById("pubCom").value.trim();
  if (!char_name) return alert("请输入角色名");

  const res = await fetch(API + "/character/add", {
    method: "POST", headers: header(),
    body: JSON.stringify({
      user_id: uid(),
      char_name,
      char_from,
      char_img,
      char_com
    })
  });
  const j = await res.json();
  alert(j.message);
  if (j.success) {
    document.getElementById("publishModal").style.display = "none";
    loadChar();
  }
}

// 加载番剧
async function loadAnime() {
  const res = await fetch(API + "/anime/list");
  const j = await res.json();
  let html = "";
  j.data.forEach(item => {
    html += `
    <div class="card card-anime">
      <img src="${item.ani_img || '/static/default.jpg'}" onError="this.src='/static/default.jpg'">
      <div class="card-body">
        <h3>${item.ani_name}</h3>
        <div class="meta">${item.ani_type}</div>
        <div class="com">${item.ani_com}</div>
      </div>
    </div>`;
  });
  document.getElementById("animeList").innerHTML = html;
}

// 加载角色（竖版卡片）
async function loadChar() {
  const res = await fetch(API + "/character/list");
  const j = await res.json();
  let html = "";
  j.data.forEach(item => {
    html += `
    <div class="card card-char">
      <img src="${item.char_img || '/static/default.jpg'}" onError="this.src='/static/default.jpg'">
      <div class="card-body">
        <h3>${item.char_name}</h3>
        <div class="meta">出自：${item.char_from}</div>
        <div class="com">${item.char_com}</div>
      </div>
    </div>`;
  });
  document.getElementById("charList").innerHTML = html;
}

// 个人主页
async function loadUserCards(user_id) {
  const a = await fetch(API + `/user/${user_id}/anime`);
  const b = await fetch(API + `/user/${user_id}/character`);
  const ja = await a.json();
  const jb = await b.json();
  let all = [];
  if (ja.success) all = all.concat(ja.data);
  if (jb.success) all = all.concat(jb.data);
  let html = "";
  all.forEach(item => {
    const isAnime = !!item.ani_id;
    const img = item.ani_img || item.char_img;
    const title = item.ani_name || item.char_name;
    const meta = item.ani_type || item.char_from;
    const com = item.ani_com || item.char_com;
    const cls = isAnime ? "card-anime" : "card-char";
    html += `
    <div class="card ${cls}">
      <img src="${img || '/static/default.jpg'}" onError="this.src='/static/default.jpg'">
      <div class="card-body">
        <h3>${title}</h3>
        <div class="meta">${meta}</div>
        <div class="com">${com}</div>
      </div>
    </div>`;
  });
  document.getElementById("profileCardList").innerHTML = html;
}

window.onload = async () => {
  initMenu();
  initModal();
  if (uid()) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainLayout").style.display = "block";
    document.getElementById("nickname").innerText = localStorage.getItem("user_name");
    loadProfile();
    loadAnime();
    loadChar();
  } else {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("mainLayout").style.display = "none";
  }

  document.getElementById("loginBtn").onclick = login;
  document.getElementById("goRegisterBtn").onclick = register;
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear(); location.reload();
  };
};