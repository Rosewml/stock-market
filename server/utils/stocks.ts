import { readFile, writeFile } from 'node:fs/promises' // 引入文件读取与写入能力。
import { resolve } from 'node:path' // 引入路径解析能力。
import { defaultPresetStocks, type PresetStock } from '../../shared/preset-stocks' // 引入默认预设与类型定义。

interface StocksFilePayload { // 定义本地 json 文件结构。
  stocks?: PresetStock[] // json 中的股票数组可选存在。
} // 结束本地文件结构定义。

export interface StocksState { // 定义股票配置读取结果结构。
  stocks: PresetStock[] // 当前可用的股票列表。
  persisted: boolean // 当前股票列表是否已经真实落盘。
} // 结束读取结果结构定义。

export const stocksFilePath = resolve(process.cwd(), 'data/stocks.json') // 解析股票配置文件绝对路径。

export const normalizeStocks = (stocks: PresetStock[]): PresetStock[] => stocks.map((stock) => ({ // 规范化股票数组结构。
  name: String(stock.name ?? '').trim(), // 清洗股票名称字段。
  code: String(stock.code ?? '').trim(), // 清洗股票代码字段。
  stockId: String(stock.stockId ?? '').trim(), // 清洗股票标识字段。
  stockNumericId: Number.isFinite(Number(stock.stockNumericId)) ? Number(stock.stockNumericId) : undefined, // 清洗 AlphaSquare 数值股票标识。
  logoUrl: String(stock.logoUrl ?? '').trim() || undefined, // 清洗股票 logo 地址。
  market: String(stock.market ?? '').trim() || undefined, // 清洗股票市场字段。
  updatedAt: String(stock.updatedAt ?? '').trim() || undefined, // 清洗最近同步时间字段。
  enabled: Boolean(stock.enabled), // 规范化启用状态字段。
})).filter((stock) => stock.name && stock.code && stock.stockId) // 过滤无效股票记录。

export const hasStoredStocks = (payload: StocksFilePayload | null | undefined): boolean => normalizeStocks(payload?.stocks ?? []).length > 0 // 判断文件中是否已真实存有股票数据。

export const resolveStocks = (payload: StocksFilePayload | null | undefined, fallback: PresetStock[] = defaultPresetStocks): PresetStock[] => { // 解析最终可用的股票列表。
  const normalizedStocks = normalizeStocks(payload?.stocks ?? []) // 先规范化文件中的股票数据。
  return normalizedStocks.length > 0 ? normalizedStocks : normalizeStocks(fallback) // 文件为空时回退默认预设。
} // 结束股票解析函数。

export const readStocksFile = async (): Promise<PresetStock[]> => { // 读取本地股票配置。
  const fileContent = await readFile(stocksFilePath, 'utf-8') // 读取 json 文件原始文本。
  const payload = JSON.parse(fileContent) as StocksFilePayload // 解析 json 文本为对象。
  return resolveStocks(payload) // 返回带默认回退的股票列表。
} // 结束读取函数。

export const readStocksState = async (): Promise<StocksState> => { // 读取股票配置及其持久化状态。
  const fileContent = await readFile(stocksFilePath, 'utf-8') // 读取 json 文件原始文本。
  const payload = JSON.parse(fileContent) as StocksFilePayload // 解析 json 文本为对象。
  return { // 返回股票列表与持久化状态。
    stocks: resolveStocks(payload), // 返回可用的股票列表。
    persisted: hasStoredStocks(payload), // 返回文件是否已经落盘过真实股票。
  } // 结束读取结果组装。
} // 结束状态读取函数。

export const writeStocksFile = async (stocks: PresetStock[]): Promise<PresetStock[]> => { // 写入本地股票配置。
  const normalizedStocks = normalizeStocks(stocks) // 先规范化待写入的股票数组。
  const fileContent = `${JSON.stringify({ stocks: normalizedStocks }, null, 2)}\n` // 组装格式化后的 json 内容。
  await writeFile(stocksFilePath, fileContent, 'utf-8') // 将规范化后的内容写入本地文件。
  return normalizedStocks // 返回实际落盘的股票列表。
} // 结束写入函数。
