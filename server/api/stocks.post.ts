import type { PresetStock } from '../../shared/preset-stocks' // 引入预设股票类型。
import { writeStocksFile } from '../utils/stocks' // 引入股票写入函数。

interface SaveStocksBody { // 定义保存接口请求体。
  stocks?: PresetStock[] // 请求体中的股票数组可选存在。
} // 结束请求体定义。

export default defineEventHandler(async (event) => { // 定义保存股票配置接口。
  const body = await readBody<SaveStocksBody>(event) // 读取客户端提交的请求体。
  const stocks = await writeStocksFile(body?.stocks ?? []) // 写入规范化后的股票配置。
  return { stocks } // 返回最新落盘的股票列表。
}) // 结束接口定义。
