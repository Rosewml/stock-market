<script setup lang="ts">
import { ElButton, ElIcon, ElInput, ElMessage, ElTable, ElTableColumn } from 'element-plus' // 引入当前页面需要的 Element Plus 组件。
import { Bell, Search } from '@element-plus/icons-vue' // 引入顶部工具区需要的图标组件。
import { defaultPresetStocks, type PresetStock } from '~~/shared/preset-stocks' // 引入默认预设股票与类型定义。
import 'element-plus/dist/index.css' // 引入 Element Plus 基础样式。

const stockName = ref('') // 绑定新增股票输入框内容。
const batchDownloadCount = ref('10') // 绑定批量下载的数量输入值。
const presetTableRef = ref<InstanceType<typeof ElTable> | null>(null) // 绑定预设股票表格实例。
const isLookingUpStock = ref(false) // 标记新增股票查询是否正在执行。
const isSavingPresets = ref(false) // 标记预设股票是否正在保存。
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
    assetValue: '386,247,300',
    today: '오늘 +5,327,800원 (+1.40%)',
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
    assetValue: '358,672,150',
    today: '오늘 +2,874,350원 (+0.81%)',
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
    assetValue: '395,880,250',
    today: '오늘 +4,521,300원 (+1.15%)',
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
    assetValue: '412,908,560', // 定义经典海军蓝主题资产金额。
    today: '오늘 +3,108,900원 (+0.76%)', // 定义经典海军蓝主题今日收益。
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
    assetValue: '367,145,980', // 定义经典青碧色主题资产金额。
    today: '오늘 +1,925,470원 (+0.53%)', // 定义经典青碧色主题今日收益。
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
    assetValue: '401,556,240', // 定义经典绯红色主题资产金额。
    today: '오늘 +6,117,300원 (+1.55%)', // 定义经典绯红色主题今日收益。
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
    assetValue: '389,226,710', // 定义经典紫罗兰主题资产金额。
    today: '오늘 +2,418,660원 (+0.63%)', // 定义经典紫罗兰主题今日收益。
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
    assetValue: '428,663,900', // 定义经典金棕色主题资产金额。
    today: '오늘 +1,782,440원 (+0.42%)', // 定义经典金棕色主题今日收益。
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
    assetValue: '376,508,120', // 定义经典炭黑色主题资产金额。
    today: '오늘 +954,320원 (+0.25%)', // 定义经典炭黑色主题今日收益。
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
    assetValue: '393,774,880', // 定义经典玫红色主题资产金额。
    today: '오늘 +3,864,250원 (+0.99%)', // 定义经典玫红色主题今日收益。
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
    assetValue: '384,192,630', // 定义经典天青色主题资产金额。
    today: '오늘 +2,290,110원 (+0.60%)', // 定义经典天青色主题今日收益。
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

const holdings = [
  { name: '삼성전자', code: '005930', qty: '806', buy: '72,650', price: '88,400', profit: '+12,669,450', rate: '+21.65%', up: true },
  { name: '두산에너빌리티', code: '034020', qty: '1,247', buy: '19,870', price: '27,350', profit: '+9,321,560', rate: '+37.65%', up: true },
  { name: '한화에어로스페이스', code: '012450', qty: '91', buy: '268,750', price: '307,000', profit: '+3,481,750', rate: '+14.20%', up: true },
  { name: '카카오뱅크', code: '323410', qty: '527', buy: '22,850', price: '25,400', profit: '+1,345,950', rate: '+11.17%', up: true },
  { name: 'HMM', code: '011200', qty: '243', buy: '17,650', price: '20,600', profit: '+717,450', rate: '+16.71%', up: true },
  { name: 'ISC', code: '095340', qty: '48', buy: '74,800', price: '89,100', profit: '+686,400', rate: '+19.11%', up: true },
  { name: '리노공업', code: '058470', qty: '35', buy: '187,300', price: '206,500', profit: '+672,000', rate: '+10.27%', up: true },
  { name: '이수페타시스', code: '007660', qty: '142', buy: '34,950', price: '33,150', profit: '-255,600', rate: '-5.15%', up: false },
  { name: '한국전력', code: '015760', qty: '942', buy: '20,350', price: '19,720', profit: '-593,460', rate: '-3.09%', up: false }
]

const marketCards = [
  { name: 'KOSPI', value: '2,628.38', change: '▲ 12.04 (+0.46%)' },
  { name: 'KOSDAQ', value: '716.42', change: '▲ 4.25 (+0.60%)' }
]

const hasPresetChanges = computed(() => !hasSavedPresetFile.value || JSON.stringify(normalizePresetStocks(presets.value)) !== JSON.stringify(normalizePresetStocks(savedPresets.value))) // 判断当前预设股票是否存在未保存修改。

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
    applyPresetSelection() // 根据最新 enabled 状态同步表格勾选。
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

const applyPresetSelection = () => {
  // 将 enabled 状态同步回表格勾选表现。
  presetTableRef.value?.clearSelection() // 先清空表格当前的所有勾选状态。
  presets.value.forEach(stock => {
    // 遍历当前预设股票列表。
    if (stock.enabled) {
      // 仅处理启用中的股票。
      presetTableRef.value?.toggleRowSelection(stock, true) // 将当前股票恢复为选中状态。
    } // 结束单条启用判断。
  }) // 结束预设股票遍历。
} // 结束表格勾选同步。

const syncPresetSelection = (selection: PresetStock[]) => {
  // 同步表格勾选结果回页面数据。
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
    await nextTick() // 等待表格依据最新数据完成重新渲染。
    applyPresetSelection() // 按最新 enabled 状态恢复表格勾选。
  } catch {
    // 捕获保存流程中的异常情况。
    presetSaveMessage.value = '保存失败，本地配置未更新' // 更新保存失败的提示信息。
  } finally {
    // 无论成功还是失败都收尾。
    isSavingPresets.value = false // 结束保存中的状态标记。
  } // 结束保存收尾。
} // 结束保存函数。

onMounted(() => {
  // 页面挂载后恢复默认勾选状态。
  nextTick(() => {
    // 等待表格渲染完成后再设置选中行。
    applyPresetSelection() // 根据当前 enabled 状态恢复表格勾选。
    presetSaveMessage.value = '未点击保存前，本地 json 不会更新' // 初始化未保存提示文案。
  }) // 结束 nextTick 回调。
}) // 结束挂载初始化。
</script>

<template>
  <div class="app-shell">
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
          <el-table ref="presetTableRef" class="preset-table" :data="presets" @selection-change="syncPresetSelection">
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
                  <el-button class="table-action-btn">编辑</el-button>
                  <el-button class="table-action-btn danger">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <p class="hint">ⓘ {{ presetSaveMessage }}</p>
        </div>
      </section>

      <section class="panel preview-panel">
        <h1>手机界面预览</h1>

        <div class="phone-frame" :style="{ '--theme': selectedTheme.accent, '--theme-dark': selectedTheme.accentDark }">
          <div class="phone-screen">
            <div class="phone-content">
              <div class="phone-status">
                <strong>9:41</strong>
                <div class="status-icons">
                  <span>▮▮▮</span>
                  <span>⌁</span>
                  <span class="battery" />
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
                      <i class="broker-tool-badge">2</i>
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
                    <strong>{{ selectedTheme.assetValue }}<small>원</small></strong>
                    <em>{{ selectedTheme.today }} 〉</em>
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
                <article v-for="card in marketCards" :key="card.name">
                  <div>
                    <p>{{ card.name }}</p>
                    <strong>{{ card.value }}</strong>
                    <em>{{ card.change }}</em>
                  </div>
                  <svg viewBox="0 0 130 58" aria-hidden="true">
                    <polyline points="4,44 18,28 30,34 41,22 56,25 68,18 78,13 88,20 98,8 110,17 124,12" />
                  </svg>
                </article>
                <div class="dots">
                  <span class="active" />
                  <span />
                  <span />
                </div>
              </section>

              <section class="holdings">
                <div class="holding-title">
                  <h2>보유종목 (9)</h2>
                  <button>평가금액순⌄</button>
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
                <div class="holding-row" v-for="row in holdings" :key="row.code">
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
                <button class="more-btn">더보기⌄</button>
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
                <img class="logo-thumb-image" :src="logo.logoPath" :alt="logo.name">
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
            <el-input v-model="batchDownloadCount" class="batch-count-input" type="number" min="1" />
            <el-button class="batch-download-btn">批量下载</el-button>
          </div>
          <el-button class="download-btn">⇩ 下载图片</el-button>
          <p class="download-note">点击下载时使用当前最新数据生成图片</p>
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

.status-icons {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 8px;
}

.battery {
  width: 20px;
  height: 9px;
  border: 2px solid #111;
  border-radius: 3px;
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
  padding: 9px 9px 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.market-strip article {
  display: flex;
  gap: 5px;
  justify-content: space-between;
  padding-right: 10px;
}

.market-strip article + article {
  padding-left: 12px;
  border-left: 1px solid #eeeeee;
}

.market-strip p {
  margin: 0 0 1px;
  font-size: 8px;
  font-weight: 800;
}

.market-strip strong,
.market-strip em {
  display: block;
  color: #f00d1f;
}

.market-strip strong {
  font-size: 15px;
}

.market-strip em {
  margin-top: 1px;
  font-size: 5.5px;
  font-style: normal;
}

.market-strip svg {
  width: 38px;
  align-self: end;
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
  margin: 7px 11px 0;
  padding-top: 3px;
  padding-bottom: 4px;
  border-radius: 8px;
  background: #fff;
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
  border: 0;
  border-radius: 999px;
  background: #f6f6f6;
  font-size: 8px;
  font-weight: 700;
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
  display: block;
  margin: 2px auto 3px;
  border: 0;
  background: transparent;
  color: #555;
  font-size: 9px;
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

  .phone-status {
    height: 24px;
    padding: 0 18px;
    font-size: 8px;
  }

  .status-icons {
    gap: 4px;
    font-size: 6px;
  }

  .battery {
    width: 16px;
    height: 7px;
    border-width: 1px;
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
    padding: 7px 7px 11px;
    border-radius: 7px;
  }

  .market-strip article {
    gap: 3px;
    padding-right: 6px;
  }

  .market-strip article + article {
    padding-left: 7px;
  }

  .market-strip p {
    margin-bottom: 1px;
    font-size: 4.5px;
  }

  .market-strip strong {
    font-size: 10px;
  }

  .market-strip em {
    margin-top: 0;
    font-size: 3px;
  }

  .market-strip svg {
    width: 24px;
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

  .holding-title {
    gap: 4px;
    padding: 0 7px 2px;
  }

  .holding-title h2 {
    font-size: 8px;
  }

  .holding-title button {
    font-size: 5px;
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
