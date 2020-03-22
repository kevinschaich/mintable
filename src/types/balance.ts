import { BaseProperty } from './common'

export interface BalanceProperty<T> extends BaseProperty<T> {}

export interface BalanceConfig {
    enabled: boolean
    properties: BalanceProperty<any>[]
}
