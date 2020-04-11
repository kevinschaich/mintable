import { IntegrationId } from './integrations'

export interface Account {
    // where this account's information came from
    provider: IntegrationId

    // a bank can have multiple accounts (e.g. Chase)
    bank?: string
    // an account has a number associated to it (e.g. Sapphire Reserve Credit Card)
    name: string

    // balances
    current: number
    available: number
    limit: number
}

export interface BaseAccountConfig {
    id: string
    integration: IntegrationId
}

export interface PlaidAccountConfig extends BaseAccountConfig {
    token: string
}

export type AccountConfig = PlaidAccountConfig
