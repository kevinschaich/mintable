import { PlaidConfig } from './integrations/plaid'
import { GoogleConfig } from './integrations/google'

export enum IntegrationType {
    Import = 'import',
    Export = 'export'
}

export enum IntegrationId {
    Plaid = 'plaid',
    Google = 'google',
    CSV = 'csv'
}

export interface BaseIntegrationConfig {
    id: IntegrationId
    name: string
    type: IntegrationType
}

export type IntegrationConfig = PlaidConfig | GoogleConfig
