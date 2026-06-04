const alphaSquareApiBaseUrl = 'https://api.alphasquare.co.kr' // 定义 AlphaSquare 接口根地址。

export interface AlphaSquareSearchStock { // 定义 AlphaSquare 搜索结果结构。
  id: number // AlphaSquare 数值股票标识。
  code: string // 股票代码。
  logo: string | null // 股票 logo 地址。
  ko_name: string // 韩文股票名称。
  market: string | null // 股票市场标识。
  type: string // 股票类型。
  is_alive: boolean // 股票是否仍在交易。
} // 结束搜索结果结构定义。

export interface AlphaSquareStockDetail { // 定义 AlphaSquare 详情结果结构。
  id: number // AlphaSquare 数值股票标识。
  code: string // 股票代码。
  logo: string | null // 股票 logo 地址。
  ko_name: string // 韩文股票名称。
  market: string | null // 股票市场标识。
} // 结束详情结果结构定义。

export interface AlphaSquareCurrentCandle { // 定义 AlphaSquare 当前价格结构。
  dt: number // 行情时间戳。
  code: string // 股票代码。
  stock_id: number // AlphaSquare 数值股票标识。
  close: number // 当前价格。
  prev_close: number // 昨收价格。
} // 结束当前价格结构定义。

interface AlphaSquareSearchResponse { // 定义 AlphaSquare 搜索接口返回结构。
  data?: AlphaSquareSearchStock[] // 搜索结果数组。
} // 结束搜索响应结构定义。

type AlphaSquareDetailResponse = Record<string, AlphaSquareStockDetail> // 定义 AlphaSquare 详情接口返回结构。

type AlphaSquareCurrentCandleResponse = Record<string, AlphaSquareCurrentCandle> // 定义 AlphaSquare 当前价格接口返回结构。

export const searchStocksByKeyword = async (keyword: string): Promise<AlphaSquareSearchStock[]> => { // 按关键字搜索股票。
  const normalizedKeyword = keyword.trim() // 清洗搜索关键字。
  const response = await $fetch<AlphaSquareSearchResponse>(`${alphaSquareApiBaseUrl}/data/v2/stock/stocks`, { // 调用 AlphaSquare 搜索接口。
    query: { // 组装搜索参数。
      keyword: normalizedKeyword, // 传入用户输入的股票名称。
      markets: ['kospi', 'kosdaq'], // 仅查询韩国主板与创业板市场。
      types: 'stock' // 仅查询股票类型数据。
    } // 结束搜索参数定义。
  }) // 结束搜索接口调用。
  return Array.isArray(response.data) ? response.data : [] // 返回安全的搜索结果数组。
} // 结束搜索函数。

export const findExactStockByName = async (name: string): Promise<AlphaSquareSearchStock | null> => { // 按完整名称查找唯一匹配股票。
  const normalizedName = name.trim() // 清洗待匹配的股票名称。
  const stocks = await searchStocksByKeyword(normalizedName) // 先执行关键字搜索。
  const exactMatch = stocks.find((stock) => stock.ko_name === normalizedName && stock.type === 'stock' && stock.is_alive) ?? null // 只接受完全一致且仍在交易的股票。
  return exactMatch // 返回完全匹配结果。
} // 结束完整匹配函数。

export const getStockDetailsByCode = async (code: string): Promise<AlphaSquareStockDetail | null> => { // 按股票代码查询详情。
  const normalizedCode = code.trim() // 清洗股票代码。
  const response = await $fetch<AlphaSquareDetailResponse>(`${alphaSquareApiBaseUrl}/data/v2/stock/details`, { // 调用 AlphaSquare 详情接口。
    query: { code: normalizedCode } // 传入股票代码参数。
  }) // 结束详情接口调用。
  return response?.[normalizedCode] ?? null // 返回对应代码的详情对象。
} // 结束详情查询函数。

export const getCurrentCandleByStockNumericId = async (stockNumericId: number): Promise<AlphaSquareCurrentCandle | null> => { // 按数值股票标识查询当前价格。
  const response = await $fetch<AlphaSquareCurrentCandleResponse>(`${alphaSquareApiBaseUrl}/data/v3/prices/current-candle`, { // 调用 AlphaSquare 当前价格接口。
    query: { // 组装当前价格查询参数。
      'stock-id': stockNumericId, // 传入 AlphaSquare 数值股票标识。
      'kr-stock-exchange': 'UNIFIED' // 统一使用 AlphaSquare 推荐的韩国交易所参数。
    } // 结束当前价格参数定义。
  }) // 结束当前价格接口调用。
  return response?.[String(stockNumericId)] ?? null // 返回对应股票的最新价格。
} // 结束当前价格查询函数。
