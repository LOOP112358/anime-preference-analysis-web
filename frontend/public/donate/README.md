# 打赏收款码

将微信 / 支付宝收款二维码图片放在此目录，例如：

- `wechat.png`
- `alipay.png`

然后在 `frontend/.env.local` 中配置：

```
NEXT_PUBLIC_DONATE_WECHAT_QR=/donate/wechat.png
NEXT_PUBLIC_DONATE_ALIPAY_QR=/donate/alipay.png
```

重新 build 或 dev 后即可在页脚「打赏支持」弹窗中显示。
