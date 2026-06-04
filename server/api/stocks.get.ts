import { readStocksState } from '../utils/stocks' // 引入股票状态读取函数。

export default defineEventHandler(async () => readStocksState()) // 定义读取股票配置接口并返回股票与持久化状态。
