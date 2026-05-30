/** 页脚意见 / 打赏配置（通过 .env.local 或部署环境变量覆盖） */
export const SITE_LINKS = {
  feedback: {
    email: process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || "",
    github: process.env.NEXT_PUBLIC_FEEDBACK_GITHUB || "",
  },
  donate: {
    wechatQr: process.env.NEXT_PUBLIC_DONATE_WECHAT_QR || "",
    alipayQr: process.env.NEXT_PUBLIC_DONATE_ALIPAY_QR || "",
    externalUrl: process.env.NEXT_PUBLIC_DONATE_LINK || "",
    note: process.env.NEXT_PUBLIC_DONATE_NOTE || "如果这个小站对你有帮助，请作者喝杯茶（¥5）就好。",
  },
};
