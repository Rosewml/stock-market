# 股票市场手机预览需求文档

## 1. 项目目标

构建一个本地 Nuxt 应用，用于从 AlphaSquare 获取指定股票数据，管理股票预设，在手机样式预览界面中展示已选股票，支持多套视觉主题，并将当前预览导出为图片。

项目第一阶段只建立项目框架并记录产品需求。业务实现将在评审后继续补充。

## 2. 推荐技术栈

- Nuxt 3 / Nuxt 4 兼容项目结构
- Vue 3
- TypeScript
- Nitro 服务端 API
- 本地 JSON 文件存储
- 后续使用 `pkg` 打包 Windows `.exe` 启动器
- 为没有安装 Node.js 的客户机器内置 `node/node.exe`
- 由本地 Node 服务打开浏览器中的本地页面
- 后续阶段使用 Playwright 或浏览器端 DOM 捕获实现图片导出
- 第一版样式使用 CSS 实现

## 3. 数据来源

目标网站：

```text
https://alphasquare.co.kr/home/special-factor?code=005930&factor=returns_top&market-key=kr-markets-all
```

已发现的 API 接口：

```text
搜索股票：
https://api.alphasquare.co.kr/data/v2/stock/stocks?keyword={name}&markets=kospi&markets=kosdaq&types=stock

当前价格：
https://api.alphasquare.co.kr/data/v3/prices/current-candle?stock-id={stockId}&kr-stock-exchange=UNIFIED

按股票代码查询详情：
https://api.alphasquare.co.kr/data/v2/stock/details?code={code}
```

## 4. 页面结构

应用使用一个主页面。股票管理和手机预览应在同一页面中同时展示。

### 4.1 左侧区域：股票管理

用途：

- 添加股票预设。
- 使用 AlphaSquare 校验股票名称。
- 展示已保存的股票预设表格。
- 选择哪些股票用于手机预览页面。
- 编辑或删除已保存的预设。

主要 UI 区域：

- 添加股票输入框。
- 校验结果提示。
- 预设股票表格。
- 选中状态复选框。
- 匹配到的股票信息，例如股票名称、代码、股票 ID、市场和 Logo。

### 4.2 中间区域：手机预览

用途：

- 以手机样式 UI 展示已选股票。
- 展示实时当前价格和本地计算字段。
- 反映当前选中的主题。

主要 UI 区域：

- 手机外框。
- 手机状态栏。
- 股票行。
- 当前价格、持仓数量、买入价格、收益金额和收益率。

### 4.3 右侧区域：主题与导出控制

用途：

- 在三套主题之间切换。
- 展示刷新状态。
- 下载手机预览图片。

主要 UI 区域：

- 主题选择器。
- 实时刷新状态。
- 下载图片按钮。
- 可选的图片生成设置。

路由占位：

```text
/
```

## 5. 核心用户流程

1. 用户打开本地 Nuxt 应用。
2. 用户在左侧股票管理区域通过股票名称添加预设。
3. 应用根据 AlphaSquare 搜索结果校验股票名称。
4. 用户选择哪些预设股票需要展示。
5. 应用为已选股票获取实时当前价格。
6. 应用在中间手机样式 UI 中渲染已选股票行。
7. 用户在右侧控制区域选择三套主题之一。
8. 用户点击下载。
9. 应用使用最新展示数据和当前主题生成图片。

## 6. 股票预设规则

- 用户只输入股票名称。
- 输入的股票名称必须与 AlphaSquare 的股票名称完全匹配。
- 如果搜索接口返回多个结果，应用只接受与 `ko_name` 完全一致的结果。
- 如果没有完全匹配结果，应用应展示校验错误，且不保存该预设。
- 已保存预设应包含原始名称、匹配到的股票 ID、股票代码、Logo URL、启用状态和时间戳。

## 7. 展示数据

每一行应展示：

- 股票名称
- 当前价格
- 持仓数量
- 买入价格
- 收益金额
- 收益率

当前价格从 AlphaSquare 获取。

以下字段在本地生成：

- 持仓数量
- 买入价格
- 收益金额
- 收益率

## 8. 计算规则

生成值必须保持内部一致。

```text
profitAmount = (currentPrice - buyPrice) * quantity
returnRate = ((currentPrice - buyPrice) / buyPrice) * 100
```

推荐随机化流程：

1. 获取当前价格。
2. 生成持仓数量。
3. 生成买入价格。
4. 计算收益金额。
5. 计算收益率。

当当前价格变化时，重新生成持仓数量和买入价格，然后重新计算收益金额和收益率。

## 9. 主题

应用应提供三套可选主题。

主题选择必须影响：

- 页面预览
- 手机 UI 预览
- 下载图片

主题名称暂未最终确定，后续可调整。

初始主题占位：

- 经典浅色
- 市场深色
- 暖纸质感

## 10. 图片下载

点击下载时：

- 使用 UI 当前展示的最新数据。
- 使用当前选中的主题。
- 随机化手机细节，例如电量和少量状态值。
- 生成 PNG 图片。

推荐实现：

- 普通浏览器开发模式下，使用服务端截图路由或前端 DOM 捕获。
- 打包为 Electron 模式时，优先使用 Electron `BrowserWindow.capturePage`，便于本地打包。
- 渲染专用导出页面或导出组件。
- 对手机 UI 容器进行截图。

## 11. Windows EXE 打包

最终面向客户的版本应打包为 Windows `.exe`，客户可以双击启动。

推荐打包方向参考 `Rosewml/youtube-auto-browser`：

```text
pkg 启动器 exe + 内置 node.exe + 本地 Node 服务 + 浏览器页面
```

预期行为：

- 用户双击 `.exe`。
- 启动器在后台启动本地 Node 服务。
- 服务自动打开默认浏览器，访问类似 `http://127.0.0.1:{port}` 的本地页面。
- 本地 API 和存储不依赖独立云服务器。
- 用户不需要运行终端命令。
- 如果包含 `node/node.exe`，客户机器不需要安装系统 Node.js。

打包说明：

- 第一开发阶段保持普通 Nuxt 应用形态。
- Web UI 和 API 流程稳定后再添加 `.exe` 启动器。
- `.exe` 应是小型启动器，而不是将完整应用打包进 Electron。
- 发布目录保持自包含：启动器 exe、构建后的 Nuxt 输出或服务端文件、data 目录、scripts、必要的 node_modules，以及 `node/node.exe`。
- JSON 存储应放在发布目录中可写的 data 文件夹。
- 如果端口已被占用，启动器应打开已有运行服务，而不是直接失败。
- 可使用心跳或空闲超时机制，在页面关闭后停止本地服务。

未来打包工具：

```text
pkg
Node.js http/server runtime
```

参考项目行为：

```text
Rosewml/youtube-auto-browser
- 使用 pkg 构建启动器 exe 文件。
- 在发布目录中包含 node/node.exe。
- 启动本地 HTTP 服务。
- 自动打开默认浏览器。
- 将可编辑客户数据存储在本地 JSON 文件中。
```

## 12. 本地存储

第一版使用 JSON 文件：

```text
data/stocks.json
```

建议结构：

```json
{
  "stocks": []
}
```

只有当 JSON 存储成为限制时，后续再引入 SQLite。

## 13. 建议路由与文件

前端：

```text
app/app.vue
app/pages/index.vue
app/components/PhonePreview.vue
app/components/StockPresetTable.vue
app/components/ThemeSelector.vue
```

服务端：

```text
server/api/health.get.ts
server/api/stocks/search.get.ts
server/api/stocks/presets.get.ts
server/api/stocks/presets.post.ts
server/api/stocks/presets/[id].delete.ts
server/api/stocks/live.get.ts
server/api/export/image.post.ts
```

共享：

```text
types/stock.ts
data/stocks.json
```

启动器打包阶段：

```text
scripts/launcher.js
scripts/server.js
scripts/build-exe.js
scripts/build-release.js
node/node.exe
```

## 14. 待确认问题

- 应用是否只支持韩国股票，还是也支持 AlphaSquare 上展示的美股和加密货币？
- 是否允许用户输入股票代码作为兜底方式，还是只能输入股票名称？
- 是否将所有已选股票展示在一张手机图片中，还是每只股票分别生成一张图片？
- 随机生成值应保持到当前价格变化为止，还是每次轮询刷新都重新生成？
- 具体手机 UI 样式应复制或参考哪一种风格？
- 三套最终主题分别应是什么视觉风格？
- 打包后的 `.exe` 在错误时是否显示控制台窗口，还是像参考启动器一样始终静默运行？

## 15. 框架阶段验收标准

- Nuxt 项目存在于 `C:\Users\Administrator\Desktop\myProject\stock-market`。
- 项目有基础落地页。
- 项目有健康检查 API 路由。
- 项目有本地 JSON 存储占位。
- 项目有共享股票类型定义。
- 需求文档存在。
- 项目依赖可成功安装。
- 基础 Nuxt 准备命令可成功执行。
