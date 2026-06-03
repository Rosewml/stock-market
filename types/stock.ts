export interface StockPreset {
  id: string
  name: string
  enabled: boolean
  stockId?: number
  code?: string
  logo?: string | null
  createdAt: string
  updatedAt: string
}

export interface StockDisplayRow {
  name: string
  currentPrice: number
  quantity: number
  buyPrice: number
  profitAmount: number
  returnRate: number
}
