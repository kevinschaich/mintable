import { IntegrationId } from './integrations'

export interface BalanceConfig {
    integration: IntegrationId
    properties?: string[]
}
