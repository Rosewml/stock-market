# 当前计划

## STATUS
已完成本轮手机预览响应式压缩与 agent-browser 截图检查。

## OBJECTIVE
在保持当前三栏卡片样式不变的前提下，让中间手机外框底部与卡片底部保持间距，并让手机屏幕内部完整展示持仓列表、海外股票活动横幅、底部导航和 home indicator。

## KNOWN FACTS
- 页面主入口为 `app/app.vue`。
- 当前项目使用 Nuxt/Vue，未安装 Element Plus。
- 用户接受根据当前电脑实际分辨率做响应式，不要求硬卡 1920x1080。
- agent-browser 截图保存到 `docs/prototype/agent-browser-layout-check.png`。

## UNKNOWNS
- 后续是否需要把当前原生控件重构为 Element Plus。
- 后续图片下载功能是否需要真实导出手机预览。

## NEXT SMALLEST STEP
继续根据用户反馈微调三套主题在不同分辨率下的视觉还原度。

## VALIDATION PLAN
- 运行 `npm run postinstall`。
- 运行 `npm run build`。
- 使用 agent-browser 打开 `http://localhost:3000` 并截图检查。
