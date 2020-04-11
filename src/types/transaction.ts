import { IntegrationId } from './integrations'

export interface Transaction {
    // where this transaction's information came from
    integration: IntegrationId

    // merchant or transaction description
    name: string
    // date of transaction
    date: Date
    // amount of transaction (purchases are positive; refunds are negative)
    amount: number
    // currency of transaction
    currency?: string
    // type of transaction (e.g. on-line or in-store)
    type: string

    // a institution can have multiple accounts (e.g. Chase)
    institution?: string
    // an account has a number associated to it (e.g. Sapphire Reserve Credit Card)
    account?: string
    // unique identifier for this account
    accountId?: string
    // unique identifier for this transaction
    transactionId?: string

    // industry or merchant category (e.g. Entertainment)
    category?: string

    // street address where the transaction occurred
    address?: string
    // city where the transaction occurred
    city?: string
    // state or province where the transaction occurred
    state?: string
    // postal code where the transaction occurred
    postal_code?: string
    // country where the transaction occurred
    country?: string
    // latitude where the transaction occurred
    latitude?: number
    // longitude where the transaction occurred
    longitude?: number

    // whether the transaction has posted or not
    pending?: boolean
}

export interface TransactionOverride {
    sourcePropertyId: string // the other property to test on (e.g. "Title")
    find: RegExp // a regex to find matches of (e.g. "*(Wegman's|Publix|Safeway)*")
    replace: RegExp // a regex to replace (e.g. "Grocery Stores")
    flags?: string // regex flags (e.g. "i" for case insensitivity)
}

export interface TransactionConfig {
    properties?: string[]
    overrides?: TransactionOverride[]
    startDate?: string
    endDate?: string
}
