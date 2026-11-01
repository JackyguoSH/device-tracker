# 我的物品

个人电子设备记录网站：首页通过原生滚动拉远真实设备画面，依次呈现使用记录，再过渡到可操作的时间轴和成本曲线。支持状态筛选与独立明细。保留时间轴缩放、全设备成本曲线及导入导出。

## 本地运行

需要 Node.js 22.13 或以上。

```sh
npm ci
npm run dev -- --port 4317
```

## Cloudflare Workers

```sh
npx wrangler login
npm run deploy
```

Worker 名称为 `device-tracker`，生产配置在构建时生成于 `dist/server/wrangler.json`。

## 数据保存

设备记录保存在当前浏览器的 localStorage 中。切换域名、浏览器或设备时，请先导出数据，再在新页面导入；当前没有云端数据同步。

源码包含个人设备的初始记录，请保留 GitHub 仓库的私有设置。
