import { IntegrationId } from './integrations'

export interface BaseAccountConfig {
    id: string
    integration: IntegrationId
}

export interface PlaidAccountConfig extends BaseAccountConfig {
    token: string
}

export type AccountConfig = PlaidAccountConfig
