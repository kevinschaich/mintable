import { BaseProperty } from './common'

export interface BalanceProperty extends BaseProperty {}

export interface BalanceConfig {
  enabled: boolean
  properties: BalanceProperty[]
}
