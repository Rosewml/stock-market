export interface PresetStock { // 定义预设股票的结构。
  name: string // 股票名称。
  code: string // 股票代码。
  stockId: string // 股票标识。
  stockNumericId?: number // AlphaSquare 数值股票标识。
  logoUrl?: string // AlphaSquare 股票 logo 地址。
  market?: string // AlphaSquare 市场标识。
  updatedAt?: string // 记录最近一次同步时间。
  enabled: boolean // 是否启用。
} // 结束预设股票类型。

export const defaultPresetStocks: PresetStock[] = [] // 默认不预置任何股票数据，等待用户手动添加。
