# 运行手册

## 本地开发

```bash
npm run dev
```

默认本地页面地址：

```text
http://localhost:3000
```

## 验证

```bash
npm run postinstall
npm run build
```

## agent-browser 检查

```bash
agent-browser --session stock-layout open http://localhost:3000
agent-browser --session stock-layout wait --load networkidle
agent-browser --session stock-layout screenshot docs\prototype\agent-browser-layout-check.png
```

检查重点：
- 中间手机外框底部不要贴住卡片底部。
- 手机屏幕内部不能出现滚动条。
- 手机屏幕内部需要显示资产卡片、行情卡片、9 条持仓、海外股票活动横幅、底部导航和 home indicator。
