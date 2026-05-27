const KEYS = {
  userId: "user_id",
  userName: "user_name",
  photo: "photo",
  intro: "user_intro",
};

export function getPostUserId() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.userId) || "";
}

export function getPostSession() {
  if (typeof window === "undefined") {
    return { userId: "", userName: "", photo: "", intro: "" };
  }
  return {
    userId: localStorage.getItem(KEYS.userId) || "",
    userName: localStorage.getItem(KEYS.userName) || "",
    photo: localStorage.getItem(KEYS.photo) || "",
    intro: localStorage.getItem(KEYS.intro) || "",
  };
}

export function setPostSession(user) {
  if (!user?.user_id) return;
  localStorage.setItem(KEYS.userId, String(user.user_id));
  localStorage.setItem(KEYS.userName, user.user_name || "");
  localStorage.setItem(KEYS.photo, user.photo || "");
  localStorage.setItem(KEYS.intro, user.user_intro || "");
}

export function clearPostSession() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
