# next-intl 配置缺失 500 报错复盘与验证报告

## 背景
- 现象：访问 `http://localhost:3000/` 报错 “Couldn't find next-intl config file”，返回 500。
- 影响范围：所有页面（App Router）渲染阻断。

## 根因
- `next.config.mjs` 中包含无效的 `experimental.turbo` 配置键，导致 Next/Turbopack 忽略配置链，`next-intl` 插件未生效，运行时找不到配置文件。

## 处置
1. 移除 `experimental.turbo` 无效键，保留 `withNextIntl('./i18n.ts')` 配置。
2. 保持 `next-intl.config.js/.ts/.mjs` 内容一致，确保至少有一个 CJS/TS 配置被运行时发现。
3. 重启 dev 服务器验证。

## 验证
- 启动：`pnpm run dev` 正常，无 500。
- 访问：`http://localhost:3000/` 正常返回页面，未再出现 “Couldn't find next-intl config file”。

## 结论
- 500 报错已消除，next-intl 配置被正确加载。

## 后续建议
- 保持单一权威配置（建议保留 TS + CJS 其中之一，避免重复），并避免添加未被支持的 experimental 配置键。
- 如需再次使用 Turbopack 相关实验特性，先确认官方支持的键名，避免阻断插件加载。

