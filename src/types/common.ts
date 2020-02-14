import {IntegrationConfig} from './integrations'
import {AccountConfig} from './account'
import {BalanceConfig} from './balance'
import {TransactionConfig} from './transaction'

enum PropertyType {
  Automated = 'automated',
  Manual = 'manual'
}

export interface BaseProperty {
  id: string
  name: string
  type: PropertyType
}

export interface Config {
  integrations: IntegrationConfig[]
  accounts: AccountConfig[]
  balances: BalanceConfig[]
  transactions: TransactionConfig[]
  debugMode: boolean
}
