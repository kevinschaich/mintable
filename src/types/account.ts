import {IntegrationId} from './integrations'

export interface BaseAccountConfig {
  name: string
  integration: IntegrationId
}

export interface PlaidAccountConfig extends BaseAccountConfig {
  token: string
}

export type AccountConfig = PlaidAccountConfig
