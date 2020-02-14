import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

enum PlaidEnvironmentType {
  Development = 'development',
  Sandbox = 'sandbox'
}

export interface PlaidCredentials {
  clientId: string
  secret: string
  publicKey: string
}

export interface PlaidConfig extends BaseIntegrationConfig {
  id: IntegrationId.Plaid
  type: IntegrationType.Import

  environment: PlaidEnvironmentType

  credentials: PlaidCredentials
}
