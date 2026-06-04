import type { PresetStock } from '../../shared/preset-stocks' // 引入预设股票类型定义。
import { findExactStockByName } from '../utils/alpha-square' // 引入 AlphaSquare 完整名称匹配函数。

interface StockLookupResponse { // 定义股票查询接口响应结构。
  stock: PresetStock // 返回匹配成功的预设股票对象。
} // 结束查询接口响应定义。

export default defineEventHandler(async (event): Promise<StockLookupResponse> => { // 定义按股票名称查询 AlphaSquare 的接口。
  const query = getQuery(event) // 读取接口查询参数。
  const name = String(query.name ?? '').trim() // 清洗用户输入的股票名称。
  if (!name) { // 判断股票名称是否为空。
    throw createError({ statusCode: 400, statusMessage: '请输入网站上的完整股票名称' }) // 直接返回缺少名称的错误。
  } // 结束名称为空判断。

  const matchedStock = await findExactStockByName(name) // 按完整名称执行 AlphaSquare 精确匹配。
  if (!matchedStock) { // 判断是否找到完全匹配股票。
    throw createError({ statusCode: 404, statusMessage: 'AlphaSquare 未找到完全匹配的股票名称' }) // 返回精确匹配失败错误。
  } // 结束匹配结果判断。

  return { // 返回前端可直接使用的股票预设结构。
    stock: { // 组装单个股票对象。
      name: matchedStock.ko_name, // 写入 AlphaSquare 返回的韩文股票名称。
      code: matchedStock.code, // 写入股票代码。
      stockId: String(matchedStock.id), // 写入 AlphaSquare 数值股票标识字符串。
      stockNumericId: matchedStock.id, // 写入 AlphaSquare 数值股票标识。
      logoUrl: matchedStock.logo ?? undefined, // 写入股票 logo 地址。
      market: matchedStock.market ?? undefined, // 写入股票市场标识。
      updatedAt: new Date().toISOString(), // 记录本次同步时间。
      enabled: true // 默认将新匹配股票设置为启用状态。
    } // 结束单个股票对象组装。
  } // 结束接口响应组装。
}) // 结束股票名称查询接口定义。
