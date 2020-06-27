import { IntegrationId } from './integrations'
import { Transaction } from './transaction'

export interface Account {
    // where this account's information came from
    integration: IntegrationId

    // unique identifier for this account
    accountId?: string
    // masked account number (e.g xxxx xxxx xxxx 1947)
    mask?: string

    // a institution can have multiple accounts (e.g. Chase)
    institution?: string
    // an account has a number associated to it (e.g. Sapphire Reserve Credit Card)
    account: string

    // type of account (e.g. credit card, 401k, etc.)
    type?: string

    current?: number
    available?: number
    limit?: number
    currency?: string

    // transaction list
    transactions?: Transaction[]
}

export interface BaseAccountConfig {
    id: string
    integration: IntegrationId
}

export interface PlaidAccountConfig extends BaseAccountConfig {
    token: string
}

export interface CSVAccountConfig extends BaseAccountConfig {
    paths: string[]
    transformer: { [inputColumn: string]: keyof Transaction }
    dateFormat: string
    negateValues?: boolean
}

export type AccountConfig = PlaidAccountConfig | CSVAccountConfig
