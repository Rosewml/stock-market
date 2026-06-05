import type { PresetStock } from '../../shared/preset-stocks' // 引入预设股票类型定义。
import { getCurrentCandleByStockNumericId, getStockDetailsByCode } from '../utils/alpha-square' // 引入 AlphaSquare 详情与价格查询函数。
import { readStocksState } from '../utils/stocks' // 引入本地股票配置读取函数。

interface MarketHoldingRow { // 定义单条持仓展示数据结构。
  name: string // 股票名称。
  code: string // 股票代码。
  stockId: string // 股票标识字符串。
  stockNumericId: number // AlphaSquare 数值股票标识。
  market?: string // 股票市场标识。
  logoUrl?: string // 股票 logo 地址。
  currentPrice: number // 当前价格。
  previousClosePrice: number // 昨收价格。
  quantity: number // 本地生成的持仓数量。
  buyPrice: number // 本地生成的买入价格。
  profitAmount: number // 本地计算的收益金额。
  returnRate: number // 本地计算的收益率。
  updatedAt: string // 当前行情同步时间。
} // 结束单条持仓结构定义。

interface MarketDataResponse { // 定义行情接口响应结构。
  generatedAt: string // 本次行情生成时间。
  holdings: MarketHoldingRow[] // 已启用股票的行情列表。
} // 结束行情接口响应定义。

const MAX_DISPLAY_HOLDINGS = 9 // 限制单次最多只为手机界面准备九条股票数据。

const hashText = (value: string): number => { // 将字符串转换为稳定数值哈希。
  return value.split('').reduce((total, char) => ((total * 33) + char.charCodeAt(0)) % 2147483647, 7) // 使用简单稳定哈希生成伪随机种子。
} // 结束哈希函数。

const resolvePriceStep = (price: number): number => { // 根据价格区间生成合适的价格步长。
  if (price >= 500000) { // 判断是否为超高价股票。
    return 1000 // 返回千元步长。
  } // 结束超高价判断。
  if (price >= 100000) { // 判断是否为高价股票。
    return 500 // 返回五百步长。
  } // 结束高价判断。
  if (price >= 10000) { // 判断是否为中高价股票。
    return 100 // 返回百元步长。
  } // 结束中高价判断。
  return 10 // 其余股票使用十元步长。
} // 结束价格步长函数。

const roundToStep = (value: number, step: number): number => Math.max(step, Math.round(value / step) * step) // 按步长将价格规整到更像真实成交价的数值。

const resolveStockNumericId = async (stock: PresetStock): Promise<{ stockNumericId: number; market?: string; logoUrl?: string; name: string }> => { // 解析单只股票的 AlphaSquare 核心标识。
  if (Number.isFinite(Number(stock.stockNumericId))) { // 判断本地数据里是否已有数值股票标识。
    return { // 直接返回已有的股票元数据。
      stockNumericId: Number(stock.stockNumericId), // 返回现成的数值股票标识。
      market: stock.market, // 返回现有股票市场。
      logoUrl: stock.logoUrl, // 返回现有股票 logo。
      name: stock.name // 返回现有股票名称。
    } // 结束已有元数据返回。
  } // 结束已有数值标识判断。

  const stockIdAsNumber = Number(stock.stockId) // 尝试把历史 stockId 解析为数值。
  if (Number.isFinite(stockIdAsNumber)) { // 判断历史 stockId 是否本身就是数值字符串。
    return { // 直接返回可用结果。
      stockNumericId: stockIdAsNumber, // 返回解析得到的数值股票标识。
      market: stock.market, // 返回现有股票市场。
      logoUrl: stock.logoUrl, // 返回现有股票 logo。
      name: stock.name // 返回现有股票名称。
    } // 结束数值字符串返回。
  } // 结束历史数值字符串判断。

  const detail = await getStockDetailsByCode(stock.code) // 回源 AlphaSquare 按代码补齐股票详情。
  if (!detail) { // 判断是否成功拿到股票详情。
    throw createError({ statusCode: 404, statusMessage: `未找到股票代码 ${stock.code} 的 AlphaSquare 详情` }) // 返回缺少详情的错误。
  } // 结束详情缺失判断。

  return { // 返回回源补齐后的股票核心元数据。
    stockNumericId: detail.id, // 返回 AlphaSquare 数值股票标识。
    market: detail.market ?? stock.market, // 优先返回详情中的市场字段。
    logoUrl: detail.logo ?? stock.logoUrl, // 优先返回详情中的 logo 字段。
    name: detail.ko_name || stock.name // 优先返回详情中的股票名称。
  } // 结束补齐结果返回。
} // 结束股票标识解析函数。

const buildHoldingRow = async (stock: PresetStock): Promise<MarketHoldingRow> => { // 为单只股票构建完整行情展示数据。
  const resolvedStock = await resolveStockNumericId(stock) // 先解析 AlphaSquare 数值股票标识。
  const candle = await getCurrentCandleByStockNumericId(resolvedStock.stockNumericId) // 再读取当前价格数据。
  if (!candle) { // 判断是否成功取得当前价格。
    throw createError({ statusCode: 502, statusMessage: `未拿到股票 ${stock.code} 的当前价格` }) // 返回价格获取失败错误。
  } // 结束价格获取结果判断。

  const seed = hashText(`${stock.code}:${candle.close}`) // 使用股票代码和当前价格生成稳定种子。
  const quantity = 20 + (seed % 981) // 在 20 到 1000 之间生成稳定持仓数量。
  const priceStep = resolvePriceStep(candle.close) // 根据当前价格计算买入价步长。
  const priceOffset = ((seed % 31) - 15) / 100 // 生成 -15% 到 +15% 的买入价偏移比例。
  const rawBuyPrice = candle.close * (1 - priceOffset) // 按偏移比例生成原始买入价。
  const buyPrice = roundToStep(rawBuyPrice, priceStep) // 将买入价按步长规整。
  const profitAmount = (candle.close - buyPrice) * quantity // 按需求文档公式计算收益金额。
  const returnRate = buyPrice === 0 ? 0 : ((candle.close - buyPrice) / buyPrice) * 100 // 按需求文档公式计算收益率。

  return { // 返回单条持仓行情数据。
    name: resolvedStock.name, // 返回股票名称。
    code: stock.code, // 返回股票代码。
    stockId: String(resolvedStock.stockNumericId), // 返回数值股票标识字符串。
    stockNumericId: resolvedStock.stockNumericId, // 返回数值股票标识。
    market: resolvedStock.market, // 返回股票市场。
    logoUrl: resolvedStock.logoUrl, // 返回股票 logo 地址。
    currentPrice: candle.close, // 返回最新当前价格。
    previousClosePrice: candle.prev_close, // 返回昨收价格。
    quantity, // 返回本地生成的持仓数量。
    buyPrice, // 返回本地生成的买入价格。
    profitAmount, // 返回本地计算的收益金额。
    returnRate, // 返回本地计算的收益率。
    updatedAt: new Date(candle.dt).toISOString() // 将 AlphaSquare 时间戳转为 ISO 时间。
  } // 结束单条持仓数据返回。
} // 结束单条行情构建函数。

export default defineEventHandler(async (): Promise<MarketDataResponse> => { // 定义读取已启用股票实时行情的接口。
  const stocksState = await readStocksState() // 读取本地股票配置状态。
  const enabledStocks = stocksState.stocks.filter((stock) => stock.enabled).slice(0, MAX_DISPLAY_HOLDINGS) // 仅保留当前启用中的前九只股票。
  const holdings = await Promise.all(enabledStocks.map((stock) => buildHoldingRow(stock))) // 并行拉取所有启用股票的实时数据。
  return { // 返回完整行情响应结构。
    generatedAt: new Date().toISOString(), // 记录本次行情生成时间。
    holdings // 返回已启用股票的行情列表。
  } // 结束行情响应组装。
}) // 结束实时行情接口定义。
