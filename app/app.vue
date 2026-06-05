<script setup lang="ts">
import { ElButton, ElDropdown, ElIcon, ElInput, ElMessage, ElTable, ElTableColumn } from 'element-plus' // 引入当前页面需要的 Element Plus 组件。
import { ArrowDown, Bell, Search } from '@element-plus/icons-vue' // 引入顶部工具区需要的图标组件。
import html2canvas from 'html2canvas' // 引入页面截图工具以便将当前手机屏幕导出为 png 图片。
import JSZip from 'jszip' // 引入压缩包工具以便将批量截图打包为 zip 下载。
import { defaultPresetStocks, type PresetStock } from '~~/shared/preset-stocks' // 引入默认预设股票与类型定义。
import 'element-plus/dist/index.css' // 引入 Element Plus 基础样式。

const stockName = ref('') // 绑定新增股票输入框内容。
const batchDownloadCount = ref('10') // 绑定批量下载的数量输入值。
const presetTableRef = ref<InstanceType<typeof ElTable> | null>(null) // 绑定预设股票表格实例。
const phoneScreenRef = ref<HTMLElement | null>(null) // 绑定手机屏幕容器实例供下载图片时直接截图。
const isLookingUpStock = ref(false) // 标记新增股票查询是否正在执行。
const isSavingPresets = ref(false) // 标记预设股票是否正在保存。
const isDownloadingPreviewImage = ref(false) // 标记当前是否正在导出手机预览图片。
const isBatchDownloadingPreviewImages = ref(false) // 标记当前是否正在批量导出手机预览图片。
const isApplyingPresetSelection = ref(false) // 标记当前是否正在回填表格勾选状态。
const presetSaveMessage = ref('') // 记录预设股票保存提示文本。

interface StocksResponse {
  // 定义股票接口返回结构。
  stocks: PresetStock[] // 返回的股票数组。
  persisted?: boolean // 返回的股票是否已经真实落盘。
} // 结束接口结构定义。

interface StockLookupResponse {
  // 定义股票查询接口返回结构。
  stock: PresetStock // 返回匹配成功的股票预设对象。
} // 结束股票查询接口结构定义。

interface MarketHoldingRow {
  // 定义手机预览使用的单条持仓原始数据结构。
  name: string // 记录股票名称。
  code: string // 记录股票代码。
  currentPrice: number // 记录接口返回的当前价格。
  quantity: number // 记录接口生成的持仓数量。
  buyPrice: number // 记录接口生成的买入价格。
  profitAmount: number // 记录接口计算的收益金额。
  returnRate: number // 记录接口计算的收益率。
} // 结束手机预览持仓数据结构定义。

interface MarketDataResponse {
  // 定义手机预览行情接口响应结构。
  generatedAt: string // 记录本次行情生成时间。
  holdings: MarketHoldingRow[] // 记录返回的持仓行情数组。
} // 结束手机预览行情接口结构定义。

interface PhoneHoldingRow {
  // 定义手机界面最终渲染的格式化持仓结构。
  name: string // 记录股票名称文本。
  code: string // 记录股票代码文本。
  qty: string // 记录格式化后的持仓数量文本。
  buy: string // 记录格式化后的买入价文本。
  price: string // 记录格式化后的当前价文本。
  profit: string // 记录格式化后的收益金额文本。
  rate: string // 记录格式化后的收益率文本。
  up: boolean // 记录当前收益是否为正值。
} // 结束手机界面持仓结构定义。

interface MarketCardRow {
  // 定义手机行情卡片最终渲染的数据结构。
  label: string // 记录卡片固定标题文本。
  name: string // 记录卡片第一行的大盘点位文本。
  value: string // 记录卡片第二行的涨跌点数文本。
  change: string // 记录卡片第三行的涨跌幅文本。
  points: string // 记录行情折线图使用的折线路径点位文本。
} // 结束手机行情卡片结构定义。

const maxPreviewHoldings = 9 // 限制手机持仓区最多展示九条数据。

const clonePresetStocks = (stocks: PresetStock[]): PresetStock[] => stocks.map(stock => ({ ...stock })) // 复制预设股票数组以隔离引用。

const normalizePresetStocks = (stocks: PresetStock[]): PresetStock[] =>
  stocks.map(stock => ({
    // 规范化页面中的预设股票数据。
    name: stock.name, // 保留股票名称字段。
    code: stock.code, // 保留股票代码字段。
    stockId: stock.stockId, // 保留股票标识字段。
    stockNumericId: stock.stockNumericId, // 保留数值股票标识字段。
    logoUrl: stock.logoUrl, // 保留股票 logo 地址字段。
    market: stock.market, // 保留股票市场字段。
    updatedAt: stock.updatedAt, // 保留最近同步时间字段。
    enabled: stock.enabled // 保留启用状态字段。
  })) // 结束预设股票规范化。

const themes = [
  {
    id: 'samsung',
    name: '三星蓝',
    description: 'mPOP 风格，蓝色卡片',
    accent: '#0d4fe3',
    accentDark: '#063fc7',
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'],
    assetLabel: '총 자산',
    badge: '자산분석',
    adColor: '#eaf2ff',
    adAccent: '#0757ff',
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기']
  },
  {
    id: 'green',
    name: '证券绿',
    description: '绿色卡，清爽交易首页',
    accent: '#0ba45c',
    accentDark: '#087f47',
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'],
    assetLabel: '내 자산',
    badge: '자산분석',
    adColor: '#eef8f2',
    adAccent: '#08a758',
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기']
  },
  {
    id: 'mirae',
    name: '未来橙',
    description: 'Mirae Asset风格，橙色卡片',
    accent: '#f15a16',
    accentDark: '#e94600',
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'],
    assetLabel: '나의 자산',
    badge: '자산분석',
    adColor: '#fff2e7',
    adAccent: '#f15a16',
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기']
  },
  {
    id: 'navy', // 定义经典海军蓝主题标识。
    name: '海军蓝', // 定义经典海军蓝主题名称。
    description: '稳重深蓝，偏专业金融风', // 定义经典海军蓝主题说明。
    accent: '#1e40af', // 定义经典海军蓝主题主色。
    accentDark: '#1d2f8a', // 定义经典海军蓝主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典海军蓝主题导航。
    assetLabel: '총 자산', // 定义经典海军蓝主题资产标题。
    badge: '자산리포트', // 定义经典海军蓝主题徽标文案。
    adColor: '#ecf2ff', // 定义经典海军蓝主题广告底色。
    adAccent: '#1e40af', // 定义经典海军蓝主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典海军蓝主题底部导航。
  },
  {
    id: 'teal', // 定义经典青碧色主题标识。
    name: '青碧色', // 定义经典青碧色主题名称。
    description: '冷静青绿，适合轻量交易页', // 定义经典青碧色主题说明。
    accent: '#0f9f9a', // 定义经典青碧色主题主色。
    accentDark: '#0a7a76', // 定义经典青碧色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典青碧色主题导航。
    assetLabel: '내 자산', // 定义经典青碧色主题资产标题。
    badge: '투자분석', // 定义经典青碧色主题徽标文案。
    adColor: '#e8f8f6', // 定义经典青碧色主题广告底色。
    adAccent: '#0f9f9a', // 定义经典青碧色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典青碧色主题底部导航。
  },
  {
    id: 'crimson', // 定义经典绯红色主题标识。
    name: '绯红色', // 定义经典绯红色主题名称。
    description: '经典红系，更有行情冲击感', // 定义经典绯红色主题说明。
    accent: '#c62839', // 定义经典绯红色主题主色。
    accentDark: '#a11d2e', // 定义经典绯红色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典绯红色主题导航。
    assetLabel: '투자 자산', // 定义经典绯红色主题资产标题。
    badge: '수익분석', // 定义经典绯红色主题徽标文案。
    adColor: '#fff0f2', // 定义经典绯红色主题广告底色。
    adAccent: '#c62839', // 定义经典绯红色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典绯红色主题底部导航。
  },
  {
    id: 'violet', // 定义经典紫罗兰主题标识。
    name: '紫罗兰', // 定义经典紫罗兰主题名称。
    description: '偏高端感的深紫金融主题', // 定义经典紫罗兰主题说明。
    accent: '#6d28d9', // 定义经典紫罗兰主题主色。
    accentDark: '#5521a8', // 定义经典紫罗兰主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典紫罗兰主题导航。
    assetLabel: '총 보유자산', // 定义经典紫罗兰主题资产标题。
    badge: '포트폴리오', // 定义经典紫罗兰主题徽标文案。
    adColor: '#f4edff', // 定义经典紫罗兰主题广告底色。
    adAccent: '#6d28d9', // 定义经典紫罗兰主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典紫罗兰主题底部导航。
  },
  {
    id: 'gold', // 定义经典金棕色主题标识。
    name: '金棕色', // 定义经典金棕色主题名称。
    description: '偏财富感的金棕配色', // 定义经典金棕色主题说明。
    accent: '#c98a18', // 定义经典金棕色主题主色。
    accentDark: '#9d6a10', // 定义经典金棕色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典金棕色主题导航。
    assetLabel: '나의 총자산', // 定义经典金棕色主题资产标题。
    badge: '프리미엄', // 定义经典金棕色主题徽标文案。
    adColor: '#fff7e7', // 定义经典金棕色主题广告底色。
    adAccent: '#c98a18', // 定义经典金棕色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典金棕色主题底部导航。
  },
  {
    id: 'charcoal', // 定义经典炭黑色主题标识。
    name: '炭黑灰', // 定义经典炭黑色主题名称。
    description: '黑灰商务感，信息密度更强', // 定义经典炭黑色主题说明。
    accent: '#374151', // 定义经典炭黑色主题主色。
    accentDark: '#1f2937', // 定义经典炭黑色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典炭黑色主题导航。
    assetLabel: '총 투자금', // 定义经典炭黑色主题资产标题。
    badge: '투자리뷰', // 定义经典炭黑色主题徽标文案。
    adColor: '#f1f3f5', // 定义经典炭黑色主题广告底色。
    adAccent: '#374151', // 定义经典炭黑色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典炭黑色主题底部导航。
  },
  {
    id: 'rose', // 定义经典玫红色主题标识。
    name: '玫红色', // 定义经典玫红色主题名称。
    description: '偏活跃感的亮丽玫红主题', // 定义经典玫红色主题说明。
    accent: '#e11d74', // 定义经典玫红色主题主色。
    accentDark: '#be185d', // 定义经典玫红色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典玫红色主题导航。
    assetLabel: '내 보유자산', // 定义经典玫红色主题资产标题。
    badge: '오늘의전략', // 定义经典玫红色主题徽标文案。
    adColor: '#fff0f7', // 定义经典玫红色主题广告底色。
    adAccent: '#e11d74', // 定义经典玫红色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典玫红色主题底部导航。
  },
  {
    id: 'sky', // 定义经典天青色主题标识。
    name: '天青色', // 定义经典天青色主题名称。
    description: '通透浅蓝，视觉更轻快', // 定义经典天青色主题说明。
    accent: '#0284c7', // 定义经典天青色主题主色。
    accentDark: '#0369a1', // 定义经典天青色主题深色。
    nav: ['HOME', ' 관심그룹', '국내주식', '해외주식', '상품', '연금/절세'], // 定义经典天青色主题导航。
    assetLabel: '총 자산', // 定义经典天青色主题资产标题。
    badge: '자산케어', // 定义经典天青色主题徽标文案。
    adColor: '#eaf7ff', // 定义经典天青色主题广告底色。
    adAccent: '#0284c7', // 定义经典天青色主题广告强调色。
    bottom: ['메뉴', '홈', '관심', '현재가', '주문', '자산', '더보기'] // 定义经典天青色主题底部导航。
  }
] // 结束主题配置列表。

const logoOptions = [
  {
    id: 'samsung', // 定义三星证券 logo 选项标识。
    name: '三星证券', // 定义三星证券 logo 选项名称。
    description: '蓝色 mPOP 品牌头图', // 定义三星证券 logo 选项说明。
    logoPath: '/logos/25f4b6c1-bbc3-4c3b-87c7-db10328daa74.png' // 定义三星证券 logo 图片路径。
  },
  {
    id: 'green', // 定义绿色证券 logo 选项标识。
    name: 'N 证券', // 定义绿色证券 logo 选项名称。
    description: '绿色 N 字品牌头图', // 定义绿色证券 logo 选项说明。
    logoPath: '/logos/fdfef4d4-d0a7-48a1-b8a7-0e7ff7b4d05d.png' // 定义绿色证券 logo 图片路径。
  },
  {
    id: 'mirae', // 定义未来资产 logo 选项标识。
    name: 'MIRAE ASSET', // 定义未来资产 logo 选项名称。
    description: '蓝橙组合品牌头图', // 定义未来资产 logo 选项说明。
    logoPath: '/logos/d48df33c-f117-49bf-b667-fe73d29ac3dc.png' // 定义未来资产 logo 图片路径。
  }
] as const // 结束顶部 logo 切换选项定义。

const selectedLogo = ref(logoOptions[0]) // 保存当前选中的顶部 logo 配置。
const selectedTheme = ref(themes[0]) // 保存当前选中的整机主题配置。

const initialPresetResponse = await $fetch<StocksResponse>('/api/stocks').catch(() => ({
  // 读取初始化的预设股票配置。
  stocks: clonePresetStocks(defaultPresetStocks), // 读取失败时回退默认预设股票。
  persisted: false // 读取失败时视为尚未完成本地持久化。
})) // 结束初始化读取。

const presets = ref<PresetStock[]>(clonePresetStocks(initialPresetResponse.stocks)) // 保存页面当前可编辑的预设股票列表。
const savedPresets = ref<PresetStock[]>(clonePresetStocks(initialPresetResponse.stocks)) // 保存最近一次已落盘的预设股票快照。
const hasSavedPresetFile = ref(Boolean(initialPresetResponse.persisted)) // 标记当前预设股票是否已经真正写入本地 json。

const marketData = ref<MarketDataResponse>({
  // 保存当前手机界面的最新行情响应，并避免服务端渲染阶段提前请求实时接口。
  generatedAt: '', // 初始化时先写入空时间占位。
  holdings: [] // 初始化时先写入空持仓列表。
}) // 结束手机行情初始状态定义。
const isRefreshingMarketData = ref(false) // 标记当前是否正在刷新手机持仓行情。
const hasLoadedInitialMarketData = ref(false) // 标记页面是否已经成功拿到过首次真实行情数据。
const shouldShowHoldingsLoading = computed(() => !hasLoadedInitialMarketData.value) // 仅在首次真实行情成功返回前显示持仓区 loading。
const randomRefreshIntervalMs = 1500 // 定义手机界面整批随机刷新的统一间隔为一千五百毫秒。
const marketDataRefreshTimer = ref<ReturnType<typeof window.setInterval> | null>(null) // 保存持仓接口轮询定时器引用。
const phoneRandomRefreshTimer = ref<ReturnType<typeof window.setInterval> | null>(null) // 保存本地随机字段轮询定时器引用。

const hasPresetChanges = computed(() => !hasSavedPresetFile.value || JSON.stringify(normalizePresetStocks(presets.value)) !== JSON.stringify(normalizePresetStocks(savedPresets.value))) // 判断当前预设股票是否存在未保存修改。

const numberFormatter = new Intl.NumberFormat('ko-KR') // 创建韩式千分位格式化器供持仓数字复用。

const formatInteger = (value: number): string => numberFormatter.format(Math.round(value)) // 将数值格式化为不带小数的千分位字符串。

const formatSignedAmount = (value: number): string => `${value >= 0 ? '+' : '-'}${formatInteger(Math.abs(value))}` // 将收益金额格式化为带正负号的整数文本。

const formatSignedRate = (value: number): string => `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%` // 将收益率格式化为带正负号的百分比文本。

const previewHoldings = computed<PhoneHoldingRow[]>(() =>
  marketData.value.holdings.slice(0, maxPreviewHoldings).map(row => ({
    // 将接口原始行情转换为手机界面需要的显示格式。
    name: row.name, // 写入股票名称文本。
    code: row.code, // 写入股票代码文本。
    qty: formatInteger(row.quantity), // 写入格式化后的持仓数量。
    buy: formatInteger(row.buyPrice), // 写入格式化后的买入价。
    price: formatInteger(row.currentPrice), // 写入格式化后的当前价。
    profit: formatSignedAmount(row.profitAmount), // 写入格式化后的收益金额。
    rate: formatSignedRate(row.returnRate), // 写入格式化后的收益率。
    up: row.profitAmount >= 0 // 根据收益金额判断涨跌颜色。
  }))
) // 结束手机持仓显示格式转换。

const holdingPlaceholderRows = computed(() => Array.from({ length: Math.max(0, maxPreviewHoldings - previewHoldings.value.length) }, (_, index) => index)) // 在不足九条时补齐空白占位行以保持区块总高度不变。

const phoneAssetValue = ref(386247300) // 保存手机资产卡片当前展示的总资产数值。
const phoneTodayProfitAmount = ref(5327800) // 保存手机资产卡片当前展示的今日收益金额数值。
const phoneTodayProfitRate = ref(2.14) // 保存手机资产卡片当前展示的今日收益率数值。
const phoneTime = ref('09:41') // 保存手机状态栏当前展示时间文本。
const notificationBadgeCount = ref(2) // 保存铃铛角标当前展示的未读数字。
const batteryLevel = ref(84) // 保存手机状态栏当前电池电量百分比，后续可接入定时器动态更新。

const normalizedBatteryLevel = computed(() => Math.min(100, Math.max(0, batteryLevel.value))) // 将电池电量限制在零到一百之间，避免样式宽度越界。

const batteryFillWidth = computed(() => Number(((normalizedBatteryLevel.value / 100) * 15.5).toFixed(2))) // 将当前电量转换为电池 SVG 内部填充宽度，便于按原生比例动态绘制。
const phoneTodayProfitAmountText = computed(() => `+${formatInteger(phoneTodayProfitAmount.value)}원`) // 将今日收益金额格式化为带加号和韩元单位的文本。
const phoneTodayProfitRateText = computed(() => `(+${phoneTodayProfitRate.value.toFixed(2)}%)`) // 将今日收益率格式化为保留两位小数的百分比文本。
const marketCards = ref<MarketCardRow[]>([
  // 保存手机行情卡片当前展示的两组随机数据。
  { label: 'KOSPI', name: '2,628.38', value: '12.04', change: '(+1.46%)', points: '4,44 18,40 30,41 41,35 56,34 68,29 78,27 88,24 98,21 110,18 124,15' }, // 初始化 KOSPI 卡片数据，避免首屏为空。
  { label: 'KOSDAQ', name: '716.42', value: '4.25', change: '(+1.60%)', points: '4,43 18,39 30,37 41,38 56,33 68,31 78,28 88,26 98,23 110,20 124,17' } // 初始化 KOSDAQ 卡片数据，避免首屏为空。
]) // 结束手机行情卡片初始状态定义。

const formatPhoneTimePart = (value: number): string => String(value).padStart(2, '0') // 将小时或分钟格式化为两位数字文本。
const formatDecimal = (value: number): string => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) // 将小数格式化为保留两位小数且带千分位的文本。

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min) // 在给定整数区间内生成随机数。
const randomDecimal = (min: number, max: number): number => Number((Math.random() * (max - min) + min).toFixed(2)) // 在给定小数区间内生成保留两位小数的随机数。
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value)) // 将数值限制在给定区间内避免折线越界。

const buildRandomPhoneTime = (): string => {
  // 生成 00:00 到 23:59 之间的随机手机时间。
  const randomHour = randomInt(0, 23) // 随机生成零到二十三之间的小时值。
  const randomMinute = randomInt(0, 59) // 随机生成零到五十九之间的分钟值。
  return `${formatPhoneTimePart(randomHour)}:${formatPhoneTimePart(randomMinute)}` // 拼出符合状态栏格式的时间文本。
} // 结束随机手机时间生成函数定义。

const buildRandomPhoneAssetValue = (): number => randomInt(100000000, 99999999999) // 生成九位到十一位之间的随机总资产数值。

const buildRandomPhoneTodayProfitAmount = (): number => randomInt(1000000, 999999999) // 生成七位到九位之间的随机今日收益金额数值。

const buildRandomPhoneTodayProfitRate = (): number => randomInt(200, 400) / 100 // 生成两到四之间且保留两位小数步进的随机今日收益率数值。

const buildRandomBatteryLevel = (): number => randomInt(50, 100) // 生成五十到一百之间的随机手机电量百分比。

const buildRandomNotificationBadgeCount = (): number => randomInt(1, 9) // 生成一到九之间的随机铃铛角标数字。

const buildRisingTrendPoints = (): string => {
  // 生成更接近真实分时图的上涨折线点位文本。
  const xAxisPoints = [4, 8, 12, 16, 21, 26, 31, 36, 41, 46, 52, 58, 64, 70, 76, 82, 88, 94, 100, 106, 112, 118, 124] // 固定更密集的拐点让折线更碎更像分时图。
  let currentY = randomInt(40, 48) // 先从图表左下区域附近随机一个起点高度。
  const pointPairs = xAxisPoints.map((pointX, index) => {
    // 遍历每个横坐标并逐步生成向上的纵坐标。
    if (index > 0) {
      // 从第二个点开始逐步调整走势。
      const trendBoost = index > 16 ? randomInt(2, 5) : randomInt(1, 4) // 在尾段进一步放大上冲步长，形成更明显的上涨冲劲。
      const wobbleDirection = randomInt(0, 4) // 随机决定当前点是上冲、横摆还是短暂回撤。
      const wobbleOffset = wobbleDirection === 0 ? randomInt(2, 5) : wobbleDirection === 1 ? randomInt(1, 3) : randomInt(-2, 2) // 通过更大的波动偏移制造密集锯齿感。
      currentY = clamp(currentY - trendBoost + wobbleOffset, 8, 48) // 让纵坐标总体向上，同时保留更大的局部振幅。
    } // 结束单个点位趋势调整。
    return `${pointX},${currentY}` // 组装当前点位为 polyline 需要的坐标文本。
  }) // 结束折线点位遍历。
  return pointPairs.join(' ') // 按空格拼出完整折线路径点位文本。
} // 结束上涨折线点位生成函数定义。

const buildRandomMarketCards = (): MarketCardRow[] => [
  // 按规则生成两张手机行情卡片的随机数据。
  {
    label: 'KOSPI', // 固定保留 KOSPI 卡片标题。
    name: formatDecimal(randomDecimal(2700, 5000)), // 将 KOSPI 第一组数值随机到 2700 到 5000 之间。
    value: formatDecimal(randomDecimal(8, 20)), // 将 KOSPI 第二组数值随机到 8 到 20 之间。
    change: `(+${randomDecimal(1, 5).toFixed(2)}%)`, // 将 KOSPI 涨跌幅随机到 1% 到 5% 之间。
    points: buildRisingTrendPoints() // 为 KOSPI 卡片生成一条整体上涨的随机折线。
  },
  {
    label: 'KOSDAQ', // 固定保留 KOSDAQ 卡片标题。
    name: formatDecimal(randomDecimal(800, 3000)), // 将 KOSDAQ 第一组数值随机到 800 到 3000 之间。
    value: formatDecimal(randomDecimal(8, 20)), // 将 KOSDAQ 第二组数值随机到 8 到 20 之间。
    change: `(+${randomDecimal(1, 5).toFixed(2)}%)`, // 将 KOSDAQ 涨跌幅随机到 1% 到 5% 之间。
    points: buildRisingTrendPoints() // 为 KOSDAQ 卡片生成一条整体上涨的随机折线。
  }
] // 结束手机行情卡片随机数据生成函数定义。

const refreshPhoneRandomFields = () => {
  // 统一刷新手机界面中按规则随机变化的字段。
  marketCards.value = buildRandomMarketCards() // 每次刷新时都重新生成两张行情卡片的随机数值。
  phoneAssetValue.value = buildRandomPhoneAssetValue() // 每次刷新时都重新生成一个新的总资产数值。
  phoneTodayProfitAmount.value = buildRandomPhoneTodayProfitAmount() // 每次刷新时都重新生成一个新的今日收益金额数值。
  phoneTodayProfitRate.value = buildRandomPhoneTodayProfitRate() // 每次刷新时都重新生成一个新的今日收益率数值。
  phoneTime.value = buildRandomPhoneTime() // 每次刷新时都重新生成一个新的状态栏时间。
  notificationBadgeCount.value = buildRandomNotificationBadgeCount() // 每次刷新时都重新生成一个新的铃铛角标数字。
  updateBatteryLevel(buildRandomBatteryLevel()) // 每次刷新时都重新生成一个新的电池电量并同步到图标宽度。
} // 结束手机随机字段刷新函数定义。

const updateBatteryLevel = (level: number) => {
  // 预留统一电池电量更新入口，后续计时器可直接调用。
  batteryLevel.value = Math.round(level) // 将外部传入的电量四舍五入后写回响应式状态。
} // 结束电池电量更新入口定义。

const sleep = (durationMs: number) =>
  new Promise(resolve => {
    // 创建一个延时 Promise 供批量下载按节奏等待。
    window.setTimeout(resolve, durationMs) // 在指定毫秒数后结束等待。
  }) // 结束延时 Promise 定义。

const normalizeBatchDownloadCountValue = (): number => {
  // 将输入框中的批量下载数量规范到一到五十之间。
  const parsedCount = Number.parseInt(batchDownloadCount.value, 10) // 尝试把当前输入值解析为整数。
  const normalizedCount = Number.isNaN(parsedCount) ? 1 : Math.min(50, Math.max(1, parsedCount)) // 将非法值回退到一并限制最大最小范围。
  batchDownloadCount.value = String(normalizedCount) // 将规范化后的数值同步写回输入框。
  return normalizedCount // 返回后续流程真正使用的批量下载数量。
} // 结束批量下载数量规范化函数定义。

const formatTimestampPart = (value: number, length = 2): string => String(value).padStart(length, '0') // 将时间片段格式化为固定位数字符串。

const buildDownloadTimestamp = (date = new Date()): string => {
  // 生成适合文件名使用的时间戳文本。
  const year = date.getFullYear() // 读取当前年份。
  const month = formatTimestampPart(date.getMonth() + 1) // 读取当前月份并补齐两位。
  const day = formatTimestampPart(date.getDate()) // 读取当前日期并补齐两位。
  const hour = formatTimestampPart(date.getHours()) // 读取当前小时并补齐两位。
  const minute = formatTimestampPart(date.getMinutes()) // 读取当前分钟并补齐两位。
  const second = formatTimestampPart(date.getSeconds()) // 读取当前秒钟并补齐两位。
  const millisecond = formatTimestampPart(date.getMilliseconds(), 3) // 读取当前毫秒并补齐三位。
  return `${year}${month}${day}-${hour}${minute}${second}-${millisecond}` // 拼出统一的文件名时间戳格式。
} // 结束时间戳文本生成函数定义。

const capturePhoneScreenCanvas = async (): Promise<HTMLCanvasElement> => {
  // 将当前手机屏幕导出为去掉边框且直角的截图 canvas。
  if (!phoneScreenRef.value) {
    // 判断截图目标节点是否已经成功挂载。
    throw new Error('当前预览区域尚未准备完成') // 缺少节点时直接抛错交给上层流程处理。
  } // 结束节点存在性判断。
  await nextTick() // 确保本轮随机后的响应式数据已经渲染完成。
  phoneScreenRef.value.classList.add('phone-screen-exporting') // 在截图前临时切换为导出态样式以去掉圆角。
  try {
    // 尝试按导出态样式生成当前手机屏幕截图。
    return await html2canvas(phoneScreenRef.value, {
      // 将当前手机屏幕节点直接渲染为高分辨率 canvas。
      backgroundColor: '#ffffff', // 导出时固定使用白色背景以避免透明边缘影响观感。
      useCORS: true, // 允许截图时加载同源或支持跨域的图片资源。
      scale: Math.max(2, window.devicePixelRatio || 1) // 按较高像素比导出以保证截图足够清晰。
    }) // 结束 html2canvas 截图调用。
  } finally {
    // 无论截图成功还是失败都需要恢复页面预览态样式。
    phoneScreenRef.value.classList.remove('phone-screen-exporting') // 移除导出态 class 以恢复页面上的圆角屏幕显示。
  } // 结束导出态样式收尾。
} // 结束统一截图 canvas 生成函数定义。

const canvasToBlob = async (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    // 将截图 canvas 转为 png Blob 供单张下载和 zip 打包复用。
    canvas.toBlob(blob => {
      // 处理浏览器异步回传的 Blob 结果。
      if (blob) {
        // 成功拿到截图 Blob 时直接结束 Promise。
        resolve(blob) // 返回可下载的 png 二进制对象。
        return // 结束当前回调。
      } // 结束成功分支。
      reject(new Error('截图导出为 Blob 失败')) // 未拿到 Blob 时主动抛出失败信息。
    }, 'image/png') // 指定将 canvas 编码为 png 格式。
  }) // 结束 canvas 转 Blob Promise 定义。

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  // 使用浏览器临时链接触发指定 Blob 文件下载。
  const downloadLink = document.createElement('a') // 创建一次性下载链接节点。
  const objectUrl = URL.createObjectURL(blob) // 将传入的 Blob 转换为可下载对象地址。
  downloadLink.href = objectUrl // 将对象地址写入下载链接。
  downloadLink.download = fileName // 设置最终下载到本地的文件名。
  downloadLink.click() // 主动触发浏览器下载动作。
  window.setTimeout(() => {
    // 在当前调用栈结束后清理临时对象地址。
    URL.revokeObjectURL(objectUrl) // 释放不再需要的对象地址避免内存泄漏。
  }, 0) // 将释放动作延后到浏览器完成链接消费之后。
} // 结束通用 Blob 下载触发函数定义。

const refreshMarketData = async () => {
  // 按当前本地已保存的勾选股票重新拉取最新行情。
  if (isRefreshingMarketData.value) {
    // 判断当前是否已有刷新请求在执行。
    return // 避免一秒五轮询与手动刷新发生并发覆盖。
  } // 结束刷新并发判断。
  isRefreshingMarketData.value = true // 标记当前开始刷新手机行情。
  try {
    // 尝试请求最新行情接口。
    const response = await $fetch<MarketDataResponse>('/api/market-data') // 调用本地行情接口获取前九只已勾选股票的最新数据。
    marketData.value = response // 用最新响应覆盖手机界面数据源。
    hasLoadedInitialMarketData.value = true // 首次成功拿到真实行情后永久关闭初始化 loading。
  } catch (error) {
    // 捕获行情刷新过程中的异常。
    console.error('刷新手机持仓行情失败', error) // 将轮询异常打印到控制台，避免界面重复弹窗打扰。
  } finally {
    // 无论成功还是失败都结束刷新标记。
    isRefreshingMarketData.value = false // 清除刷新中的状态。
  } // 结束本次行情刷新流程。
} // 结束手机持仓行情刷新函数。

const downloadPreviewImage = async () => {
  // 将当前手机屏幕可见内容直接导出为 png 图片。
  if (isDownloadingPreviewImage.value || isBatchDownloadingPreviewImages.value) {
    // 如果当前已经在导出中则直接终止重复点击。
    return // 避免重复生成多个截图任务。
  } // 结束重复点击判断。
  isDownloadingPreviewImage.value = true // 标记当前开始执行截图导出。
  try {
    const canvas = await capturePhoneScreenCanvas() // 先生成当前手机屏幕的导出截图 canvas。
    const imageBlob = await canvasToBlob(canvas) // 将截图 canvas 转换为可下载的 png Blob。
    const imageFileName = `phone-screen-${buildDownloadTimestamp()}.png` // 按时间戳规则生成当前单图文件名。
    triggerBlobDownload(imageBlob, imageFileName) // 触发浏览器下载当前单张 png 截图。
    ElMessage.success('当前手机界面已下载为 PNG 图片') // 下载成功后给出轻提示反馈。
  } catch (error) {
    // 捕获截图或下载过程中的异常。
    console.error('导出手机界面图片失败', error) // 将失败原因输出到控制台便于排查。
    ElMessage.error('下载图片失败，请稍后重试') // 下载失败时向用户展示错误反馈。
  } finally {
    // 无论成功或失败都要结束下载状态。
    isDownloadingPreviewImage.value = false // 重置导出状态以恢复按钮可点击。
  } // 结束导出图片流程。
} // 结束手机界面 png 下载函数定义。

const batchDownloadPreviewImages = async () => {
  // 按输入数量批量随机手机界面并打包下载所有 png 截图。
  if (isDownloadingPreviewImage.value || isBatchDownloadingPreviewImages.value) {
    // 如果当前已有单张或批量下载任务在执行则直接终止。
    return // 避免多个下载任务并发导致状态互相覆盖。
  } // 结束并发下载判断。
  isBatchDownloadingPreviewImages.value = true // 标记当前开始执行批量下载流程。
  try {
    // 尝试执行整批截图和 zip 打包下载。
    const totalDownloadCount = normalizeBatchDownloadCountValue() // 先把批量下载数量规范到允许范围内。
    const zipArchive = new JSZip() // 创建一个新的 zip 压缩包实例。
    const batchStartTime = performance.now() // 记录当前批量任务开始时间用于控制下载节奏。
    const intervalDurationMs = 100 // 按每十张一秒换算出每张截图的目标间隔为一百毫秒。
    for (let currentIndex = 0; currentIndex < totalDownloadCount; currentIndex += 1) {
      // 按输入数量依次生成每一张随机截图。
      const expectedStartTime = batchStartTime + currentIndex * intervalDurationMs // 计算当前这一张截图理论上应该开始的时间点。
      const waitDurationMs = expectedStartTime - performance.now() // 计算距离理论开始时间还需要等待多少毫秒。
      if (waitDurationMs > 0) {
        // 仅在当前速度快于目标节奏时才主动等待。
        await sleep(waitDurationMs) // 等待到当前截图该开始的时间点。
      } // 结束节奏等待判断。
      refreshPhoneRandomFields() // 按当前已有逻辑刷新本地随机字段以生成新一张界面状态。
      const canvas = await capturePhoneScreenCanvas() // 将本轮随机后的手机屏幕导出为截图 canvas。
      const imageBlob = await canvasToBlob(canvas) // 将截图 canvas 转为 png Blob 以便写入压缩包。
      const imageFileName = `phone-screen-${buildDownloadTimestamp()}.png` // 按时间戳规则生成当前截图在压缩包中的文件名。
      zipArchive.file(imageFileName, imageBlob) // 将当前截图文件写入 zip 压缩包。
    } // 结束整批截图循环。
    const zipBlob = await zipArchive.generateAsync({ type: 'blob' }) // 将所有截图异步打包生成最终 zip Blob。
    const zipFileName = `phone-screen-batch-${buildDownloadTimestamp()}.zip` // 按时间戳规则生成压缩包文件名。
    triggerBlobDownload(zipBlob, zipFileName) // 触发浏览器下载最终 zip 压缩包。
    ElMessage.success(`已打包下载 ${totalDownloadCount} 张 PNG 图片`) // 批量下载成功后提示本次导出的图片数量。
  } catch (error) {
    // 捕获批量下载或压缩打包过程中的异常。
    console.error('批量导出手机界面图片失败', error) // 将失败原因输出到控制台便于排查。
    ElMessage.error('批量下载失败，请稍后重试') // 批量下载失败时向用户展示错误反馈。
  } finally {
    // 无论成功还是失败都需要结束批量下载状态。
    isBatchDownloadingPreviewImages.value = false // 重置批量导出状态以恢复按钮和输入框交互。
  } // 结束批量下载流程收尾。
} // 结束批量手机界面 png 下载函数定义。

const addStock = async () => {
  // 按当前输入的完整股票名称调用后端查询接口。
  const normalizedStockName = stockName.value.trim() // 先清洗输入框中的股票名称。
  if (!normalizedStockName || isLookingUpStock.value) {
    // 输入为空或正在查询时直接终止。
    presetSaveMessage.value = normalizedStockName ? '正在校验股票名称，请稍候' : '请先输入网站上的完整股票名称' // 根据不同前置状态更新提示文案。
    return // 结束本次添加流程。
  } // 结束前置校验。
  isLookingUpStock.value = true // 标记当前开始查询 AlphaSquare 股票信息。
  presetSaveMessage.value = '正在校验股票名称并获取网站数据...' // 更新查询中的提示文案。
  try {
    // 尝试请求后端股票查询接口。
    const response = await $fetch<StockLookupResponse>('/api/stock-lookup', {
      // 调用本地股票查询接口。
      query: { name: normalizedStockName } // 传入用户输入的完整股票名称。
    }) // 结束后端查询接口调用。
    const existingStockIndex = presets.value.findIndex(stock => stock.code === response.stock.code || stock.name === response.stock.name) // 根据代码或名称查找是否已有同一只股票。
    if (existingStockIndex >= 0) {
      // 已存在时直接提示并终止，不再修改当前预设列表。
      presetSaveMessage.value = '该股票已存在于预设列表中，未重复添加' // 更新重复股票的提示文案。
      ElMessage.warning('该股票已存在于预设列表中') // 使用 Element 消息提示重复添加已被拦截。
      return // 直接结束重复添加流程。
    } // 结束重复股票判断。
    presets.value = [{ ...response.stock, enabled: false }, ...presets.value] // 将新匹配股票插入到预设列表最前面并默认保持未勾选状态。
    presetSaveMessage.value = '匹配成功，已添加到预设列表，点击保存后才会写入本地配置' // 更新添加成功的提示文案。
    ElMessage.success('匹配成功，已添加到预设列表') // 使用 Element 消息提示添加成功。
    stockName.value = '' // 添加成功后清空输入框内容。
    await nextTick() // 等待表格根据最新数据重新渲染。
    await applyPresetSelection() // 根据最新 enabled 状态同步表格勾选。
  } catch (error) {
    // 捕获查询过程中的异常情况。
    const statusMessage = error && typeof error === 'object' && 'statusMessage' in error ? String(error.statusMessage ?? '') : error instanceof Error ? error.message : '' // 尝试优先读取接口返回的错误文案。
    const failedMessage = statusMessage.includes('未找到完全匹配') ? '未找到完全匹配的股票名称，请按网站全名输入' : '添加失败，请稍后重试或检查股票名称是否准确' // 根据异常信息生成用户可理解的失败提示文案。
    presetSaveMessage.value = failedMessage // 将失败提示同步到页面提示区域。
    ElMessage.error(failedMessage) // 使用 Element 消息提示当前添加失败原因。
  } finally {
    // 无论成功还是失败都结束查询状态。
    isLookingUpStock.value = false // 清除查询中的状态标记。
  } // 结束添加流程收尾。
} // 结束新增股票函数。

const applyPresetSelection = async () => {
  // 将 enabled 状态同步回表格勾选表现。
  isApplyingPresetSelection.value = true // 标记当前开始执行程序化勾选回填。
  presetTableRef.value?.clearSelection() // 先清空表格当前的所有勾选状态。
  presets.value.forEach(stock => {
    // 遍历当前预设股票列表。
    if (stock.enabled) {
      // 仅处理启用中的股票。
      presetTableRef.value?.toggleRowSelection(stock, true) // 将当前股票恢复为选中状态。
    } // 结束单条启用判断。
  }) // 结束预设股票遍历。
  await nextTick() // 等待表格完成本轮勾选状态同步。
  isApplyingPresetSelection.value = false // 标记程序化勾选回填已经结束。
} // 结束表格勾选同步。

const syncPresetSelection = (selection: PresetStock[]) => {
  // 同步表格勾选结果回页面数据。
  if (isApplyingPresetSelection.value) {
    // 程序主动回填勾选时不反向覆盖 enabled 状态。
    return // 结束本次程序化勾选同步。
  } // 结束程序化勾选拦截。
  presets.value.forEach(stock => {
    // 遍历所有预设股票。
    stock.enabled = selection.some(item => item.code === stock.code) // 根据当前选择状态更新 enabled 字段。
  }) // 结束状态同步。
  presetSaveMessage.value = hasPresetChanges.value ? '有未保存的预设更改' : '当前预设已与本地配置一致' // 根据脏状态刷新提示文案。
} // 结束选择同步函数。

const savePresets = async () => {
  // 保存当前预设股票到本地 json。
  if (!hasPresetChanges.value || isSavingPresets.value) {
    // 无改动或保存中时直接返回。
    return // 结束本次保存请求。
  } // 结束前置状态判断。
  isSavingPresets.value = true // 标记保存流程开始。
  presetSaveMessage.value = '正在保存预设股票...' // 更新保存中的提示信息。
  try {
    // 尝试执行本地保存请求。
    const response = await $fetch<StocksResponse>('/api/stocks', {
      // 调用本地保存接口。
      method: 'POST', // 指定使用 POST 方法提交。
      body: { stocks: normalizePresetStocks(presets.value) } // 仅提交当前预设股票的必要字段。
    }) // 结束本地保存请求。
    presets.value = clonePresetStocks(response.stocks) // 用落盘后的结果刷新页面当前数据。
    savedPresets.value = clonePresetStocks(response.stocks) // 更新最近一次已保存的快照数据。
    hasSavedPresetFile.value = true // 标记当前预设股票已经完成本地落盘。
    presetSaveMessage.value = '预设股票已保存到本地配置' // 更新保存成功的提示信息。
    ElMessage.success('预设股票已保存到本地配置') // 使用 Element 消息提示当前保存成功。
    await nextTick() // 等待表格依据最新数据完成重新渲染。
    await applyPresetSelection() // 按最新 enabled 状态恢复表格勾选。
    await refreshMarketData() // 保存成功后立即按本地最新勾选状态刷新手机持仓区。
  } catch {
    // 捕获保存流程中的异常情况。
    presetSaveMessage.value = '保存失败，本地配置未更新' // 更新保存失败的提示信息。
    ElMessage.error('保存失败，本地配置未更新') // 使用 Element 消息提示当前保存失败。
  } finally {
    // 无论成功还是失败都收尾。
    isSavingPresets.value = false // 结束保存中的状态标记。
  } // 结束保存收尾。
} // 结束保存函数。

onMounted(() => {
  // 页面挂载后恢复默认勾选状态。
  nextTick(() => {
    // 等待表格渲染完成后再设置选中行。
    void applyPresetSelection() // 根据当前 enabled 状态恢复表格勾选。
  }) // 结束 nextTick 回调。
  refreshPhoneRandomFields() // 页面进入后先立即刷新一次本地随机字段，避免其他区域等待接口后才开始变化。
  void refreshMarketData() // 页面进入后立即再拉取一次最新持仓行情，确保客户端显示的是当前值。
  phoneRandomRefreshTimer.value = window.setInterval(() => {
    // 创建一秒五本地随机定时器以持续刷新不依赖接口的展示字段。
    refreshPhoneRandomFields() // 每次轮询都直接刷新手机本地随机字段而不等待接口返回。
  }, randomRefreshIntervalMs) // 结束本地随机定时器注册。
  marketDataRefreshTimer.value = window.setInterval(() => {
    // 创建一秒五接口轮询定时器以持续刷新手机持仓区。
    void refreshMarketData() // 每次轮询都重新获取本地已勾选股票的最新行情，但不阻塞其他随机区域。
  }, randomRefreshIntervalMs) // 结束一秒五轮询注册。
}) // 结束挂载初始化。

onBeforeUnmount(() => {
  // 页面卸载前清理所有轮询定时器。
  if (phoneRandomRefreshTimer.value !== null) {
    // 判断当前是否存在已注册的本地随机定时器。
    window.clearInterval(phoneRandomRefreshTimer.value) // 清除本地随机轮询以避免页面离开后继续执行。
    phoneRandomRefreshTimer.value = null // 重置本地随机定时器引用状态。
  } // 结束本地随机定时器存在判断。
  if (marketDataRefreshTimer.value !== null) {
    // 判断当前是否存在已注册的接口轮询定时器。
    window.clearInterval(marketDataRefreshTimer.value) // 清除接口轮询以避免页面离开后继续请求。
    marketDataRefreshTimer.value = null // 重置接口轮询定时器引用状态。
  } // 结束接口定时器存在判断。
}) // 结束卸载清理逻辑。
</script>

<template>
  <div class="app-shell" :aria-busy="shouldShowHoldingsLoading">
    <NuxtRouteAnnouncer />

    <header class="window-bar">
      <div class="window-title">Stock Market</div>
      <div class="service-pill">
        <span />
        本地服务运行中
      </div>
    </header>

    <main class="workspace">
      <section class="panel left-panel">
        <h1>股票管理</h1>

        <!-- 股票管理卡片统一改为 Element Plus 组件，并尽量保持现有视觉表现。 -->
        <div class="card add-card">
          <h2>添加股票名称</h2>
          <div class="add-row">
            <el-input v-model="stockName" class="stock-input" placeholder="请输入网站上的完整股票名称" @keyup.enter="addStock" />
            <el-button class="stock-primary-btn" :loading="isLookingUpStock" :disabled="isLookingUpStock" @click="addStock">{{ isLookingUpStock ? '校验中...' : '添加股票' }}</el-button>
          </div>
        </div>

        <div class="card preset-card">
          <!-- 预设股票区域支持先编辑、后保存到本地 json。 -->
          <div class="preset-header">
            <h2>预设股票</h2>
            <el-button class="save-presets-btn" :disabled="!hasPresetChanges || isSavingPresets" @click="savePresets">
              {{ isSavingPresets ? '保存中...' : '保存' }}
            </el-button>
          </div>
          <el-table ref="presetTableRef" class="preset-table" :data="presets" :height="460" @selection-change="syncPresetSelection">
            <el-table-column type="selection" width="78" align="center" header-align="center" class-name="selection-column" label-class-name="selection-column" />
            <el-table-column label="股票名称" align="center" header-align="center" class-name="stock-name-cell">
              <template #default="{ row }">
                <span class="stock-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="代码" align="center" header-align="center" />
            <el-table-column prop="stockId" label="股票ID" align="center" header-align="center" />
            <el-table-column label="操作" align="center" header-align="center">
              <template #default>
                <div class="actions">
                  <el-button class="table-action-btn danger">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>

      <section class="panel preview-panel">
        <h1>手机界面预览</h1>

        <div class="phone-frame" :style="{ '--theme': selectedTheme.accent, '--theme-dark': selectedTheme.accentDark }">
          <div ref="phoneScreenRef" class="phone-screen">
            <div class="phone-content">
              <div class="phone-status">
                <strong>{{ phoneTime }}</strong>
                <div class="status-icons">
                  <!-- 右上角信号和 WiFi 改为图片资源，便于直接替换为更贴近真机的图标素材。 -->
                  <span class="status-signal" aria-hidden="true">
                    <img src="/status-signal.svg" alt="" />
                  </span>
                  <span class="status-wifi" aria-hidden="true">
                    <img src="/status-wifi.svg" alt="" />
                  </span>
                  <span class="battery" :aria-label="`当前电池电量 ${normalizedBatteryLevel}%`">
                    <svg viewBox="0 0 26 14" role="presentation">
                      <rect x="1" y="2" width="20" height="10" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="1.6" />
                      <rect x="22.25" y="5" width="1.7" height="4" rx="1" ry="1" fill="currentColor" opacity="0.9" />
                      <rect x="2.7" y="3.8" :width="batteryFillWidth" height="6.4" rx="1.8" ry="1.8" fill="currentColor" />
                    </svg>
                  </span>
                </div>
              </div>

              <div class="broker-head">
                <!-- 顶部品牌区改为按当前选项渲染 logo。 -->
                <div class="brand-logo-preview" :class="`phone-logo-${selectedLogo.id}`" :aria-label="selectedLogo.name">
                  <template v-if="selectedLogo.id === 'samsung'">
                    <span class="phone-logo-samsung">
                      <span class="phone-logo-samsung-ko">삼성증권</span>
                      <span class="phone-logo-samsung-en">mPOP</span>
                    </span>
                  </template>
                  <template v-else-if="selectedLogo.id === 'green'">
                    <span class="phone-logo-green">
                      <span class="phone-logo-green-mark">N</span>
                      <span class="phone-logo-green-text">증권</span>
                    </span>
                  </template>
                  <template v-else>
                    <span class="phone-logo-mirae">
                      <span class="phone-logo-mirae-main">MIRAE ASSET</span>
                      <span class="phone-logo-mirae-sub">미래에셋증권</span>
                      <i class="phone-logo-mirae-slash" />
                    </span>
                  </template>
                </div>
                <div class="broker-tools">
                  <span class="broker-tool broker-tool-search">
                    <el-icon class="broker-tool-icon broker-tool-icon-search"><Search /></el-icon>
                    <span class="broker-tool-label">검색</span>
                  </span>
                  <span class="broker-tool broker-tool-alert">
                    <span class="broker-tool-bell-wrap">
                      <el-icon class="broker-tool-icon broker-tool-icon-bell"><Bell /></el-icon>
                      <i class="broker-tool-badge">{{ notificationBadgeCount }}</i>
                    </span>
                  </span>
                  <span class="broker-tool broker-tool-my">MY</span>
                  <span class="broker-tool broker-tool-menu">
                    <span class="broker-tool-menu-lines" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                </div>
              </div>

              <nav class="phone-tabs">
                <span v-for="(item, index) in selectedTheme.nav" :key="item" :class="{ active: index === 0 }">
                  {{ item }}
                </span>
              </nav>

              <section class="asset-card">
                <div class="asset-top">
                  <div>
                    <p>{{ selectedTheme.assetLabel }} <span>◉</span></p>
                    <strong>{{ formatInteger(phoneAssetValue) }}<small>원</small></strong>
                    <em
                      ><span>오늘 {{ phoneTodayProfitAmountText }}</span> <span>{{ phoneTodayProfitRateText }}</span> 〉</em
                    >
                  </div>
                  <button>{{ selectedTheme.badge }}</button>
                </div>
                <div class="asset-shortcuts">
                  <span>ⓦ<b>입출금</b></span>
                  <span>↗<b>투자정보</b></span>
                  <span>▤<b>주문내역</b></span>
                  <span>•••<b>더보기</b></span>
                </div>
              </section>

              <section class="market-strip">
                <article v-for="card in marketCards" :key="card.label">
                  <div class="market-strip-copy">
                    <p>{{ card.label }}</p>
                    <strong>{{ card.name }}</strong>
                    <em>▲ {{ card.value }} {{ card.change }}</em>
                  </div>
                  <svg viewBox="0 0 130 58" aria-hidden="true">
                    <polyline :points="card.points" />
                  </svg>
                </article>
                <div class="dots">
                  <span class="active" />
                  <span />
                  <span />
                </div>
              </section>

              <!-- 持仓区改为展示本地已保存且已勾选股票的实时行情，固定总高度并最多展示九条。 -->
              <section class="holdings">
                <div v-if="shouldShowHoldingsLoading" class="holdings-loading-mask">
                  <span class="holdings-loading-spinner" />
                  <strong>正在获取持仓行情</strong>
                  <p>接口返回前，其它随机区域仍会继续刷新</p>
                </div>
                <div class="holding-title">
                  <h2>보유종목 ({{ previewHoldings.length }})</h2>
                  <el-dropdown class="more-dropdown">
                    <span class="el-dropdown-link more-dropdown-link" style="font-weight: bold">
                      평가금액순
                      <el-icon class="el-icon--right" style="font-weight: bold">
                        <ArrowDown />
                      </el-icon>
                    </span>
                  </el-dropdown>
                  <span>⚙</span>
                </div>
                <div class="holding-head">
                  <span>종목명</span>
                  <span>보유수량</span>
                  <span>매입가<br />(평균)</span>
                  <span>현재가</span>
                  <span>평가손익(원)</span>
                  <span>수익률(%)</span>
                </div>
                <div class="holding-row" v-for="row in previewHoldings" :key="row.code">
                  <div>
                    <strong>{{ row.name }}</strong>
                    <small>{{ row.code }}</small>
                  </div>
                  <span>{{ row.qty }}</span>
                  <span>{{ row.buy }}</span>
                  <span>{{ row.price }}</span>
                  <span :class="row.up ? 'up' : 'down'">{{ row.profit }}</span>
                  <span :class="row.up ? 'up' : 'down'">{{ row.rate }}</span>
                </div>
                <div class="holding-row placeholder" v-for="placeholderIndex in holdingPlaceholderRows" :key="`placeholder-${placeholderIndex}`" aria-hidden="true">
                  <div>
                    <strong>&nbsp;</strong>
                    <small>&nbsp;</small>
                  </div>
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                  <span>&nbsp;</span>
                </div>
                <el-dropdown class="more-dropdown">
                  <span class="el-dropdown-link more-dropdown-link">
                    더보기
                    <el-icon class="el-icon--right">
                      <ArrowDown />
                    </el-icon>
                  </span>
                </el-dropdown>
              </section>

              <section class="promo" :style="{ background: selectedTheme.adColor }">
                <div>
                  <p>해외주식 거래하고</p>
                  <strong>최대 <span :style="{ color: selectedTheme.adAccent }">100달러</span> 받아가세요!</strong>
                  <small>기간 : 2024.05.01 ~ 2024.06.30</small>
                </div>
                <div class="coupon" :style="{ color: selectedTheme.adAccent }">$100</div>
              </section>

              <nav class="bottom-nav">
                <span class="active">
                  <i class="nav-n">N</i>
                  홈
                </span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3.4l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8L12 3.4z" />
                  </svg>
                  관심종목
                </span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 19h16M7 16V9m5 7V5m5 11v-4M6 10l6-5 5 4 3-3" />
                  </svg>
                  현재가
                </span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 7h11M15 4l3 3-3 3M17 17H6m3-3-3 3 3 3" />
                  </svg>
                  주문
                </span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 8V6.5C7 5.1 8.1 4 9.5 4h5C15.9 4 17 5.1 17 6.5V8M5 8h14v11H5zM5 12h14" />
                  </svg>
                  자산
                </span>
                <span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="5" cy="12" r="1.7" />
                    <circle cx="12" cy="12" r="1.7" />
                    <circle cx="19" cy="12" r="1.7" />
                  </svg>
                  더보기
                </span>
              </nav>
              <div class="home-indicator" />
            </div>
          </div>
        </div>
      </section>

      <section class="panel right-panel">
        <h1>主题与下载</h1>

        <!-- logo 选择卡片沿用主题卡片的交互与排版节奏。 -->
        <div class="card logo-card">
          <h2>Logo 切换</h2>
          <button v-for="logo in logoOptions" :key="logo.id" class="logo-option" :class="{ selected: selectedLogo.id === logo.id }" @click="selectedLogo = logo">
            <span class="logo-thumb">
              <span class="logo-thumb-inner">
                <img class="logo-thumb-image" :src="logo.logoPath" :alt="logo.name" />
              </span>
            </span>
            <span class="option-copy">
              <strong>{{ logo.name }}</strong>
              <em>{{ logo.description }}</em>
            </span>
            <b>{{ selectedLogo.id === logo.id ? '✓' : '' }}</b>
          </button>
        </div>

        <!-- 主题卡片加高，下载区改为下载操作卡片。 -->
        <div class="card theme-card">
          <h2>主题选择</h2>
          <div class="theme-options">
            <button v-for="theme in themes" :key="theme.id" class="theme-option" :class="{ selected: selectedTheme.id === theme.id }" @click="selectedTheme = theme">
              <span class="theme-thumb" :style="{ '--thumb': theme.accent }">
                <span class="theme-thumb-inner">
                  <span class="theme-thumb-preview">
                    <i class="theme-thumb-banner" />
                    <i class="theme-thumb-footer" />
                  </span>
                </span>
              </span>
              <span class="option-copy">
                <strong>{{ theme.name }}</strong>
                <em>{{ theme.description }}</em>
              </span>
              <b>{{ selectedTheme.id === theme.id ? '✓' : '' }}</b>
            </button>
          </div>
        </div>

        <div class="card download-card">
          <h2>下载操作</h2>
          <div class="batch-download-row">
            <el-input v-model="batchDownloadCount" class="batch-count-input" type="number" min="1" max="50" :disabled="isDownloadingPreviewImage || isBatchDownloadingPreviewImages" @change="normalizeBatchDownloadCountValue" />
            <el-button class="batch-download-btn" :loading="isBatchDownloadingPreviewImages" :disabled="isDownloadingPreviewImage || isBatchDownloadingPreviewImages" @click="batchDownloadPreviewImages">
              {{ isBatchDownloadingPreviewImages ? '批量打包中...' : '批量下载' }}
            </el-button>
          </div>
          <el-button class="download-btn" :loading="isDownloadingPreviewImage" style="margin-top: 10px" :disabled="isDownloadingPreviewImage || isBatchDownloadingPreviewImages" @click="downloadPreviewImage">
            {{ isDownloadingPreviewImage ? '图片导出中...' : '⇩ 下载图片' }}
          </el-button>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
:root {
  color: #0c1f18;
  background: #f8f7f3;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Segoe UI', sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input {
  font: inherit;
}

.app-shell {
  width: 100vw;
  min-height: 100dvh;
  overflow-x: hidden;
  background: radial-gradient(circle at 50% 8%, rgba(11, 76, 49, 0.08), transparent 34rem), #fbfaf7;
}

@keyframes initial-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.window-bar {
  display: flex;
  align-items: center;
  height: 70px;
  padding: 0 28px;
  color: #fff;
  background: linear-gradient(90deg, #01291d 0%, #004029 52%, #012f23 100%);
  box-shadow: 0 2px 16px rgba(2, 48, 31, 0.22);
}

.window-title {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.service-pill {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 28px;
  padding: 9px 18px;
  border: 1px solid rgba(38, 211, 101, 0.3);
  border-radius: 10px;
  color: #d5ffe0;
  background: rgba(1, 72, 45, 0.72);
  font-size: 16px;
}

.service-pill span {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #00d832;
  box-shadow: 0 0 18px rgba(0, 216, 50, 0.7);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(430px, 38.5%) minmax(430px, 31.5%) minmax(360px, 30%);
  gap: 18px;
  height: calc(100dvh - 70px);
  min-height: 0;
  padding: 18px;
}

.panel {
  min-height: 0;
  overflow: auto;
  padding: 24px 22px 20px;
  border: 1px solid rgba(217, 213, 205, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 60px rgba(30, 42, 35, 0.08);
  scrollbar-width: thin;
}

.panel::-webkit-scrollbar {
  width: 6px;
}

.panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(0, 64, 41, 0.22);
}

.left-panel {
  display: flex;
  flex-direction: column;
}

h1 {
  margin: 0 0 22px;
  font-size: 29px;
  letter-spacing: -0.04em;
}

h2 {
  margin: 0;
  font-size: 19px;
}

.card {
  border: 1px solid #ddd8cf;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 18px 50px rgba(33, 29, 20, 0.04);
}

.add-card {
  flex: 0 0 auto;
  padding: 22px 16px 28px;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 12px;
  margin-top: 17px;
}

.stock-input {
  width: 100%;
}

.add-row .el-input {
  width: 100%;
}

.add-row .el-input__wrapper {
  height: 56px;
  padding: 0 20px;
  border: 1px solid #d7d2ca;
  border-radius: 7px;
  box-shadow: none;
  color: #736f69;
  background: #fff;
  font-size: 16px;
}

.add-row .el-input__inner {
  color: #736f69;
  font-size: 16px;
}

.add-row .el-input__wrapper.is-focus {
  border-color: #00492f;
  box-shadow: 0 0 0 1px #00492f inset;
}

.stock-primary-btn,
.download-btn {
  height: 56px;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(180deg, #006342, #003f2d);
  font-weight: 800;
}

.stock-primary-btn.el-button,
.download-btn {
  margin: 0;
}

.stock-primary-btn.el-button:hover,
.stock-primary-btn.el-button:focus-visible,
.stock-primary-btn.el-button:active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(180deg, #006342, #003f2d);
}

.preset-card {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 24px;
  padding: 22px 14px;
}

.preset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.save-presets-btn.el-button {
  min-width: 88px;
  height: 38px;
  margin: 0;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(180deg, #006342, #003f2d);
  font-weight: 800;
}

.save-presets-btn.el-button:hover,
.save-presets-btn.el-button:focus-visible,
.save-presets-btn.el-button:active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(180deg, #006342, #003f2d);
}

.save-presets-btn.el-button.is-disabled,
.save-presets-btn.el-button.is-disabled:hover {
  color: rgba(255, 255, 255, 0.78);
  background: linear-gradient(180deg, #81a796, #5d786c);
}

.preset-table {
  width: 100%;
  margin-top: 16px;
  border: 1px solid #e1ddd6;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.68);
}

.preset-table .el-table__inner-wrapper::before {
  display: none;
}

.preset-table .el-table__header-wrapper th.el-table__cell,
.preset-table .el-table__body td.el-table__cell {
  height: 84px;
  padding: 0 11px;
  border-bottom: 1px solid #ebe7df;
  background: rgba(255, 255, 255, 0.68);
  text-align: center;
  white-space: nowrap;
}

.preset-table .el-table__header-wrapper th.el-table__cell {
  height: 58px;
  color: #1a261f;
  font-weight: 500;
  text-align: center;
}

.preset-table .el-table__header-wrapper .cell,
.preset-table .el-table__body .cell {
  padding: 0;
}

.preset-table .el-table__header-wrapper th.selection-column.el-table__cell,
.preset-table .el-table__body td.selection-column.el-table__cell {
  padding: 0;
  text-align: center;
}

.preset-table .el-table__header-wrapper th.selection-column .cell,
.preset-table .el-table__body td.selection-column .cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preset-table .el-table__body tr:last-child td.el-table__cell {
  border-bottom: 0;
}

.stock-name {
  color: #07100c;
  font-weight: 900;
}

.status {
  padding: 8px 12px;
  border-radius: 7px;
  font-weight: 800;
}

.status.matched {
  border: 1px solid #78c792;
  color: #16743b;
  background: #edf9f0;
}

.status.pending {
  border: 1px solid #ffa52e;
  color: #ed7c00;
  background: #fff9ed;
}

.actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.table-action-btn.el-button {
  min-width: 46px;
  height: 30px;
  margin: 0;
  padding: 0 10px;
  border: 1px solid #9ea5a0;
  border-radius: 6px;
  color: #083823;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
}

.table-action-btn.el-button:hover,
.table-action-btn.el-button:focus-visible,
.table-action-btn.el-button:active {
  color: #083823;
  border-color: #9ea5a0;
  background: #fff;
}

.actions .danger.el-button {
  border-color: #ff6b70;
  color: #ff202a;
}

.actions .danger.el-button:hover,
.actions .danger.el-button:focus-visible,
.actions .danger.el-button:active {
  border-color: #ff6b70;
  color: #ff202a;
  background: #fff;
}

.hint {
  margin: 18px 0 0;
  color: #6c6d68;
  font-size: 14px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding-bottom: 28px;
}

.preview-panel h1 {
  width: min(100%, 520px);
}

.phone-frame {
  width: min(390px, calc(100dvh * 0.42));
  height: min(790px, calc(100dvh - 170px));
  padding: 11px;
  border: 5px solid #101010;
  border-radius: 50px;
  background: #050505;
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.18),
    0 0 0 4px #393939 inset;
}

.phone-screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 36px;
  background: #fff;
}

.phone-screen.phone-screen-exporting {
  border-radius: 0;
}

.phone-screen::before {
  position: absolute;
  z-index: 3;
  top: 0;
  left: 50%;
  width: 132px;
  height: 27px;
  border-radius: 0 0 16px 16px;
  background: #050505;
  content: '';
  transform: translateX(-50%);
}

.phone-screen.phone-screen-exporting::before {
  display: none;
  content: none;
}

.phone-content {
  position: relative;
  height: 100%;
  padding-bottom: 52px;
}

.phone-status {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 22px;
  font-size: 10px;
}

.phone-status strong {
  font-size: 12px;
}

.status-icons {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  color: #111;
}

.status-signal {
  display: inline-flex;
  width: 18px;
  height: 12px;
  transform: translateY(-0.35px);
}

.status-signal img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.status-wifi {
  display: inline-flex;
  width: 17px;
  height: 13px;
  transform: translateY(-1.3px);
}

.status-wifi img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.battery {
  display: inline-flex;
  width: 26px;
  height: 14px;
  margin-left: 1px;
  transform: translateY(0);
}

.battery svg {
  display: block;
  width: 100%;
  height: 100%;
  color: currentColor;
}

.broker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 42px;
  padding: 0 18px;
}

.brand-logo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  min-width: 96px;
  height: 24px;
  min-height: 24px;
  overflow: hidden;
}

.phone-logo-samsung,
.phone-logo-green,
.phone-logo-mirae {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  white-space: nowrap;
  line-height: 1;
}

.phone-logo-samsung {
  gap: 4px;
}

.phone-logo-samsung-ko {
  color: #1f57da;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.1em;
}

.phone-logo-samsung-en {
  color: #1f57da;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.08em;
}

.phone-logo-green {
  gap: 4px;
  justify-content: flex-start;
  width: 100%;
}

.phone-logo-green-mark {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 2px;
  color: #fff;
  background: #15b24c;
  font-size: 13px;
  font-weight: 800;
}

.phone-logo-green-text {
  color: #111;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.08em;
}

.phone-logo-mirae {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1px;
  padding-right: 7px;
}

.phone-logo-mirae-main {
  color: #1d4b88;
  font-size: 11px;
  font-style: italic;
  font-weight: 800;
  letter-spacing: -0.06em;
}

.phone-logo-mirae-sub {
  color: #1d4b88;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: -0.08em;
}

.phone-logo-mirae-slash {
  position: absolute;
  top: -1px;
  right: 0;
  width: 7px;
  height: 2px;
  border-radius: 999px;
  background: #ff7a1b;
  transform: rotate(-58deg);
}

.broker-tools {
  display: flex;
  gap: 12px;
  align-items: center;
  color: #222;
  font-size: 9px;
  line-height: 1;
}

.broker-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #222;
  line-height: 1;
}

.broker-tool-search {
  gap: 5px;
  justify-content: flex-start;
}

.broker-tool-label {
  color: #222;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.06em;
  white-space: nowrap;
}

.broker-tool-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #222;
}

.broker-tool-icon svg {
  display: block;
}

.broker-tool-icon-search {
  font-size: 19px;
  stroke-width: 1.9;
}

.broker-tool-bell-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.broker-tool-icon-bell {
  font-size: 18px;
  stroke-width: 1.8;
}

.broker-tool-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  display: grid;
  place-items: center;
  min-width: 13px;
  height: 13px;
  padding: 0 2px;
  border-radius: 50%;
  color: #fff;
  background: #f21e2b;
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}

.broker-tool-my {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.broker-tool-menu-lines {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 16px;
  height: 14px;
}

.broker-tool-menu-lines i {
  display: block;
  width: 100%;
  height: 1.6px;
  border-radius: 999px;
  background: #222;
  font-style: normal;
}

.phone-tabs {
  display: flex;
  justify-content: space-between;
  height: 30px;
  padding: 0 18px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 10px;
  font-weight: 800;
}

.phone-tabs span {
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

.phone-tabs .active {
  color: var(--theme);
  border-color: var(--theme);
}

.asset-card {
  margin: 5px 11px 0;
  padding: 8px 12px 2px;
  border-radius: 8px;
  color: #fff;
  background: radial-gradient(circle at 22% 78%, rgba(255, 255, 255, 0.14), transparent 14rem), linear-gradient(135deg, var(--theme), var(--theme-dark));
}

.asset-top {
  display: flex;
  justify-content: space-between;
}

.asset-top p {
  margin: 0 0 3px;
  font-size: 9px;
  font-weight: 800;
}

.asset-top strong {
  display: block;
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.03em;
}

.asset-top small {
  margin-left: 3px;
  font-size: 8px;
}

.asset-top em {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
}

.asset-top button {
  align-self: flex-start;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  font-size: 7px;
  font-weight: 800;
}

.asset-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 5px;
  padding: 3px 0 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  text-align: center;
}

.asset-shortcuts span {
  display: grid;
  gap: 3px;
  font-size: 15px;
}

.asset-shortcuts b {
  font-size: 6.5px;
}

.market-strip {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 5px 11px 0;
  min-height: 82px;
  padding: 10px 9px 15px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.market-strip article {
  display: grid;
  grid-template-columns: 78px 38px;
  align-items: center;
  column-gap: 10px;
  justify-content: start;
  padding-right: 0;
}

.market-strip article + article {
  padding-left: 12px;
  border-left: 1px solid #eeeeee;
}

.market-strip-copy {
  width: 78px;
  min-width: 78px;
}

.market-strip p {
  margin: 0 0 1px;
  font-size: 7.4px;
  font-weight: 800;
}

.market-strip strong,
.market-strip em {
  display: block;
  color: #f00d1f;
}

.market-strip strong {
  font-size: 18px;
  line-height: 1.05;
}

.market-strip em {
  margin-top: 1px;
  font-size: 7.2px;
  font-style: normal;
  font-weight: 800;
  line-height: 1.15;
}

.market-strip svg {
  width: 38px;
  align-self: center;
}

.market-strip polyline {
  fill: none;
  stroke: #f20c20;
  stroke-width: 4;
}

.dots {
  position: absolute;
  bottom: 4px;
  left: 50%;
  display: flex;
  gap: 6px;
  transform: translateX(-50%);
}

.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9dce3;
}

.dots .active {
  background: var(--theme);
}

.holdings {
  position: relative;
  margin: 7px 11px 0;
  padding-top: 3px;
  padding-bottom: 4px;
  border-radius: 8px;
  background: #fff;
}

.holdings-loading-mask {
  position: absolute;
  inset: 24px 0 18px;
  z-index: 3;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  padding: 18px 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(3px);
  text-align: center;
}

.holdings-loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 83, 57, 0.14);
  border-top-color: #005339;
  border-radius: 50%;
  animation: initial-loading-spin 0.9s linear infinite;
}

.holdings-loading-mask strong {
  color: #14372a;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
}

.holdings-loading-mask p {
  margin: 0;
  color: #5a675f;
  font-size: 8px;
  line-height: 1.4;
}

.holding-title {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 6px;
  align-items: center;
  padding: 0 10px 4px;
}

.holding-title h2 {
  font-size: 13px;
}

.holding-title button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1px;
  width: fit-content;
  border: 0;
  border-radius: 999px;
  background: #f6f6f6;
  padding: 1px 4px;
  font-size: 7px;
  font-weight: 700;
}

.down-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55em;
  line-height: 1;
  transform: translateY(-0.1px);
}

.holding-head,
.holding-row {
  display: grid;
  grid-template-columns: 1.35fr 0.75fr 0.9fr 0.85fr 1.2fr 0.85fr;
  align-items: center;
  column-gap: 5px;
}

.holding-head {
  padding: 0 9px 4px;
  border-bottom: 1px solid #eeeeee;
  color: #333;
  font-size: 6.5px;
}

.holding-row {
  min-height: 23px;
  padding: 0 9px;
  border-bottom: 1px solid #f1f1f1;
  font-size: 7.5px;
}

.holding-row.placeholder {
  color: transparent;
}

.holding-row strong,
.holding-row small {
  display: block;
}

.holding-row strong {
  font-size: 7.5px;
}

.holding-row small {
  margin-top: 1px;
  font-size: 6px;
}

.up {
  color: #f00718;
}

.down {
  color: #0757dc;
}

.more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  margin: 2px auto 3px;
  border: 0;
  background: transparent;
  color: #555;
  font-size: 9px;
}

.more-dropdown {
  display: flex;
  justify-content: center;
  padding-top: 2px;
  padding-bottom: 2px;
}

.more-dropdown-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: #555;
  font-size: 8px;
  line-height: 1;
  cursor: pointer;
}

.more-dropdown-link .el-icon--right {
  margin-left: 0;
  font-size: 10px;
}

.promo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 11px 5px;
  padding: 6px 14px;
  border-radius: 7px;
}

.promo p,
.promo strong,
.promo small {
  display: block;
  margin: 0;
}

.promo p {
  font-size: 10px;
}

.promo strong {
  margin-top: 2px;
  font-size: 11px;
}

.promo small {
  margin-top: 3px;
  color: #555;
  font-size: 7px;
}

.coupon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 39px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  font-size: 18px;
  font-weight: 950;
  transform: rotate(-4deg);
}

.bottom-nav {
  position: absolute;
  right: 0;
  bottom: 9px;
  left: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  height: 41px;
  padding: 5px 8px 0;
  border-top: 1px solid #e9e9e9;
  text-align: center;
  background: #fff;
}

.bottom-nav span {
  display: grid;
  grid-template-rows: 17px 1fr;
  gap: 2px;
  place-items: center;
  color: #222;
  font-size: 7px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.bottom-nav svg {
  width: 15px;
  height: 15px;
  overflow: visible;
  fill: none;
  stroke: #1f1f1f;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.bottom-nav svg circle {
  fill: #1f1f1f;
  stroke: none;
}

.nav-n {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  color: #fff;
  background: #14b866;
  font-size: 8px;
  font-style: normal;
  font-weight: 950;
  line-height: 1;
}

.bottom-nav .active {
  color: #14b866;
  font-weight: 900;
}

.home-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 100px;
  height: 4px;
  border-radius: 999px;
  background: #000;
  transform: translateX(-50%);
}

.right-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1.95fr) minmax(0, 1.95fr) minmax(0, 1.1fr);
  gap: 12px;
  overflow: hidden;
  padding-left: 30px;
  padding-right: 30px;
}

.logo-card,
.theme-card {
  display: grid;
  gap: 8px;
  min-height: 0;
  padding: 12px 12px 14px;
  overflow: hidden;
}

.logo-card {
  grid-template-rows: auto repeat(3, minmax(0, 1fr));
}

.theme-card {
  grid-template-rows: auto minmax(0, 1fr);
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  padding-right: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  align-items: stretch;
}

.theme-options::-webkit-scrollbar {
  width: 6px;
}

.theme-options::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(0, 83, 57, 0.26);
}

.theme-options::-webkit-scrollbar-track {
  background: transparent;
}

.download-card {
  display: grid;
  grid-template-rows: auto auto auto auto;
  align-content: start;
  gap: 8px;
  min-height: 0;
  padding: 12px 12px 14px;
  overflow: hidden;
}

.logo-card {
  flex: 0 0 auto;
}

.logo-card h2,
.theme-card h2 {
  flex: 0 0 auto;
}

.logo-option,
.theme-option {
  position: relative;
  display: grid;
  grid-template-columns: 104px 1fr 20px;
  gap: 14px;
  align-items: center;
  width: 100%;
  min-height: 0;
  padding: 10px 12px;
  border: 1px solid #ded9d1;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  flex: 0 0 auto;
  box-sizing: border-box;
}

.logo-option {
  min-height: 0;
}

.theme-option {
  min-height: 0;
  height: calc((100% - 12px) / 3);
  flex: 0 0 calc((100% - 12px) / 3);
}

.logo-option.selected,
.theme-option.selected {
  border-color: #005339;
  box-shadow: inset 0 0 0 1px #005339;
}

.logo-thumb,
.theme-thumb {
  display: grid;
  place-items: center;
  height: 58px;
  overflow: hidden;
}

.logo-thumb {
  padding: 8px;
  border-radius: 5px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e2ded8;
}

.theme-thumb {
  padding: 8px;
  border-radius: 5px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e2ded8;
}

.logo-thumb-inner,
.theme-thumb-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transform-origin: center center;
}

.logo-thumb-inner {
  width: 100%;
  height: 100%;
  transform: none;
  overflow: hidden;
}

.logo-thumb-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
}

.theme-thumb-inner {
  width: 100%;
  height: 100%;
  transform: none;
}

.theme-thumb-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 72%;
  height: 70%;
  max-width: 72px;
  max-height: 40px;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.theme-thumb-banner {
  display: block;
  width: 100%;
  height: 18px;
  border-radius: 4px;
  background: var(--thumb);
}

.theme-thumb-footer {
  display: block;
  width: 46px;
  height: 4px;
  border-radius: 1px;
  background: #ecebea;
}

.option-copy {
  min-width: 0;
}

.logo-option strong,
.logo-option em,
.theme-option strong,
.theme-option em {
  display: block;
}

.logo-option strong,
.theme-option strong {
  font-size: 15px;
  line-height: 1.15;
}

.logo-option em,
.theme-option em {
  margin-top: 4px;
  color: #66615c;
  font-size: 12px;
  font-style: normal;
  line-height: 1.25;
}

.logo-option b,
.theme-option b {
  display: grid;
  align-self: center;
  place-items: center;
  justify-self: center;
  width: 22px;
  height: 22px;
  margin: 0;
  border: 1px solid #9a9a9a;
  border-radius: 50%;
  color: #fff;
  background: transparent;
  font-size: 14px;
}

.logo-option.selected b,
.theme-option.selected b {
  border-color: #005339;
  background: #005339;
}

.download-btn.el-button {
  width: 100%;
  height: 44px;
  margin-top: 0;
  margin-left: 0;
  font-size: 20px;
}

.download-btn.el-button:hover,
.download-btn.el-button:focus-visible,
.download-btn.el-button:active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(180deg, #006342, #003f2d);
  box-shadow: none;
}

.batch-download-row {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 0;
}

.batch-count-input {
  flex: 0 0 25%;
  width: 25%;
  min-width: 0;
}

.batch-download-btn.el-button {
  flex: 1 1 75%;
  min-width: 0;
}

.batch-count-input .el-input__wrapper {
  height: 42px;
  padding: 0 10px;
  border: 1px solid #d7d2ca;
  border-radius: 7px;
  box-shadow: none;
}

.batch-count-input .el-input__inner {
  text-align: center;
  font-size: 16px;
}

.batch-download-btn.el-button {
  width: 100%;
  height: 42px;
  margin: 0;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: linear-gradient(180deg, #1f8f63, #056344);
  font-size: 16px;
  font-weight: 800;
}

.batch-download-btn.el-button:hover,
.batch-download-btn.el-button:focus-visible,
.batch-download-btn.el-button:active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(180deg, #1f8f63, #056344);
}

.download-note {
  margin: 0;
  color: #7b7770;
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
}

@media (min-width: 1201px) and (max-height: 1000px) {
  .window-bar {
    height: 64px;
  }

  .workspace {
    height: calc(100dvh - 64px);
  }

  .panel {
    padding-top: 22px;
    padding-bottom: 14px;
  }

  h1 {
    margin-bottom: 18px;
    font-size: 27px;
  }

  .right-panel {
    padding-left: 30px;
    padding-right: 30px;
  }

  .logo-card,
  .theme-card,
  .download-card {
    gap: 7px;
    padding: 11px 11px 12px;
  }

  .logo-option,
  .theme-option {
    grid-template-columns: 92px 1fr 18px;
    gap: 12px;
    padding: 8px 10px;
  }

  .logo-thumb,
  .theme-thumb {
    height: 50px;
  }

  .logo-thumb-inner {
    transform: scale(0.62);
  }

  .logo-option strong,
  .theme-option strong {
    font-size: 14px;
  }

  .logo-option em,
  .theme-option em {
    font-size: 11px;
  }

  .batch-count-input .el-input__wrapper,
  .batch-download-btn.el-button {
    height: 38px;
  }

  .download-btn.el-button {
    height: 40px;
    font-size: 18px;
  }

  .download-note {
    font-size: 11px;
  }

  .phone-frame {
    width: min(370px, calc(100dvh * 0.4));
    height: min(760px, calc(100dvh - 170px));
  }
}

@media (min-width: 1201px) and (max-height: 860px) {
  .window-bar {
    height: 58px;
  }

  .workspace {
    height: calc(100dvh - 58px);
  }

  .panel {
    padding-top: 18px;
    padding-bottom: 12px;
  }

  h1 {
    margin-bottom: 14px;
    font-size: 25px;
  }

  .add-card {
    padding: 18px 16px 22px;
  }

  .add-row {
    margin-top: 13px;
  }

  .add-row .el-input__wrapper {
    height: 48px;
  }

  .preset-card {
    margin-top: 18px;
    padding-top: 18px;
  }

  .preset-table .el-table__header-wrapper th.el-table__cell {
    height: 50px;
  }

  .preset-table .el-table__body td.el-table__cell {
    height: 72px;
  }

  .logo-thumb,
  .theme-thumb {
    height: 42px;
  }

  .logo-thumb-inner {
    transform: scale(0.54);
  }

  .logo-option strong,
  .theme-option strong {
    font-size: 13px;
  }

  .logo-option em,
  .theme-option em {
    margin-top: 2px;
    font-size: 10px;
  }

  .logo-card,
  .theme-card,
  .download-card {
    gap: 6px;
    padding: 10px 10px 11px;
  }

  .batch-count-input .el-input__wrapper,
  .batch-download-btn.el-button {
    height: 34px;
  }

  .batch-download-btn.el-button {
    font-size: 14px;
  }

  .download-btn.el-button {
    height: 36px;
    font-size: 16px;
  }

  .download-note {
    font-size: 10px;
  }

  .phone-frame {
    width: min(350px, calc(100dvh * 0.38));
    height: min(700px, calc(100dvh - 178px));
    padding: 8px;
    border-width: 4px;
    border-radius: 42px;
  }

  .phone-screen {
    border-radius: 30px;
  }

  .phone-screen.phone-screen-exporting {
    border-radius: 0;
  }

  .phone-content {
    width: calc(100% / 0.8);
    height: calc(100% / 0.8);
    padding-bottom: 44px;
    transform: scale(0.8);
    transform-origin: top left;
  }

  .phone-screen::before {
    width: 104px;
    height: 22px;
    border-radius: 0 0 13px 13px;
  }

  .phone-screen.phone-screen-exporting::before {
    display: none;
    content: none;
  }

  .phone-status {
    height: 24px;
    padding: 0 18px;
    font-size: 8px;
  }

  .phone-status strong {
    font-size: 10px;
  }

  .status-icons {
    gap: 3px;
  }

  .status-signal {
    height: 8px;
    width: 12px;
    transform: translateY(-0.25px);
  }

  .status-wifi {
    width: 12px;
    height: 9px;
    transform: translateY(-1.2px);
  }

  .battery {
    width: 18px;
    height: 10px;
    margin-left: 1px;
  }

  .broker-head {
    height: 30px;
    padding: 0 13px;
  }

  .brand-logo-preview {
    width: 78px;
    min-width: 78px;
    height: 18px;
    min-height: 18px;
  }

  .phone-logo-samsung-ko {
    font-size: 8px;
  }

  .phone-logo-samsung-en {
    font-size: 13px;
  }

  .phone-logo-green-mark {
    width: 10px;
    height: 10px;
    font-size: 9px;
  }

  .phone-logo-green-text {
    font-size: 10px;
  }

  .phone-logo-mirae-main {
    font-size: 7px;
  }

  .phone-logo-mirae-sub {
    font-size: 4px;
  }

  .broker-tools {
    gap: 8px;
    font-size: 7px;
  }

  .broker-tool-label {
    font-size: 6px;
  }

  .broker-tool-icon-search {
    font-size: 15px;
  }

  .broker-tool-icon-bell {
    font-size: 14px;
  }

  .broker-tool-badge {
    top: -4px;
    right: -6px;
    min-width: 10px;
    height: 10px;
    padding: 0 1px;
    font-size: 5px;
  }

  .broker-tool-my {
    font-size: 7px;
  }

  .broker-tool-menu-lines {
    gap: 2px;
    width: 12px;
    height: 10px;
  }

  .broker-tool-menu-lines i {
    height: 1.2px;
  }

  .phone-tabs {
    height: 20px;
    padding: 0 13px;
    font-size: 6.5px;
  }

  .phone-tabs span {
    border-bottom-width: 1px;
  }

  .asset-card {
    margin: 3px 8px 0;
    padding: 6px 8px 2px;
    border-radius: 7px;
  }

  .asset-top p {
    margin-bottom: 1px;
    font-size: 5.5px;
  }

  .asset-top strong {
    font-size: 16px;
  }

  .asset-top small {
    font-size: 5px;
  }

  .asset-top em {
    margin-top: 1px;
    font-size: 5.5px;
  }

  .asset-top button {
    padding: 2px 5px;
    font-size: 4px;
  }

  .asset-shortcuts {
    margin-top: 3px;
    padding: 2px 0 3px;
  }

  .asset-shortcuts span {
    gap: 1px;
    font-size: 9px;
  }

  .asset-shortcuts b {
    font-size: 3.5px;
  }

  .market-strip {
    margin: 5px 8px 0;
    min-height: 52px;
    padding: 8px 7px 12px;
    border-radius: 7px;
  }

  .market-strip article {
    grid-template-columns: 50px 24px;
    column-gap: 6px;
    justify-content: start;
    padding-right: 0;
  }

  .market-strip article + article {
    padding-left: 7px;
  }

  .market-strip p {
    margin-bottom: 1px;
    font-size: 4.2px;
  }

  .market-strip strong {
    font-size: 12.4px;
    line-height: 1.05;
  }

  .market-strip em {
    margin-top: 0;
    font-size: 4px;
    font-weight: 800;
    line-height: 1.12;
  }

  .market-strip svg {
    width: 24px;
    align-self: center;
  }

  .dots {
    bottom: 4px;
    gap: 4px;
  }

  .dots span {
    width: 5px;
    height: 5px;
  }

  .holdings {
    margin: 4px 8px 0;
    padding-top: 2px;
    padding-bottom: 4px;
  }

  .holdings-loading-mask {
    inset: 18px 0 14px;
    gap: 5px;
    padding: 12px 8px;
  }

  .holdings-loading-spinner {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }

  .holdings-loading-mask strong {
    font-size: 7px;
  }

  .holdings-loading-mask p {
    font-size: 4.6px;
  }

  .holding-title {
    gap: 4px;
    padding: 0 7px 2px;
  }

  .holding-title h2 {
    font-size: 8px;
  }

  .holding-title button {
    padding: 1px 3px;
    font-size: 4.6px;
  }

  .down-arrow {
    transform: translateY(-0.1px);
  }

  .holding-head,
  .holding-row {
    grid-template-columns: 1.28fr 0.65fr 0.78fr 0.76fr 1.04fr 0.74fr;
    column-gap: 3px;
  }

  .holding-head {
    padding: 0 6px 2px;
    font-size: 4px;
    line-height: 1.08;
  }

  .holding-row {
    min-height: 13px;
    padding: 0 6px;
    font-size: 4.2px;
  }

  .holding-row strong {
    font-size: 4.4px;
    line-height: 1;
  }

  .holding-row small {
    margin-top: 0;
    font-size: 3.6px;
    line-height: 1;
  }

  .more-btn {
    margin: 1px auto 2px;
    font-size: 5px;
  }

  .more-dropdown-link {
    font-size: 4.6px;
  }

  .more-dropdown-link .el-icon--right {
    font-size: 5.8px;
  }

  .more-dropdown {
    padding-top: 1px;
    padding-bottom: 1px;
  }

  .promo {
    margin: 0 8px 5px;
    padding: 4px 9px;
    border-radius: 6px;
  }

  .promo p {
    font-size: 5.5px;
  }

  .promo strong {
    margin-top: 1px;
    font-size: 6.5px;
  }

  .promo small {
    margin-top: 1px;
    font-size: 4px;
  }

  .coupon {
    width: 48px;
    height: 26px;
    border-radius: 7px;
    font-size: 11px;
  }

  .bottom-nav {
    height: 29px;
    padding: 3px 6px 0;
  }

  .bottom-nav span {
    grid-template-rows: 11px 1fr;
    gap: 1px;
    font-size: 4.8px;
    line-height: 1;
    white-space: nowrap;
  }

  .bottom-nav svg {
    width: 10px;
    height: 10px;
    stroke-width: 1.8;
  }

  .nav-n {
    width: 10px;
    height: 10px;
    font-size: 5.5px;
  }

  .home-indicator {
    bottom: 3px;
    width: 76px;
    height: 3px;
  }
}

@media (max-width: 1200px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: calc(100vh - 70px);
  }

  .panel {
    overflow: visible;
    padding-bottom: 48px;
  }

  .panel + .panel {
    border-top: 0;
  }

  .preview-panel h1 {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .window-bar {
    height: auto;
    flex-wrap: wrap;
    gap: 12px;
    padding: 18px;
  }

  .panel {
    padding: 20px 14px;
  }

  .add-row,
  .logo-option,
  .theme-option {
    grid-template-columns: 1fr;
  }

  .preset-card {
    overflow-x: auto;
  }

  .phone-frame {
    width: min(100%, 350px);
    height: 720px;
    transform-origin: top center;
  }
}
</style>
.market-strip-copy { width: 50px; min-width: 50px; }
