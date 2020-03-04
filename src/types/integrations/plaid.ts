import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export enum PlaidEnvironmentType {
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

export const defaultPlaidConfig: PlaidConfig = {
  name: '',
  id: IntegrationId.Plaid,
  type: IntegrationType.Import,

  environment: PlaidEnvironmentType.Sandbox,

  credentials: {
    clientId: '',
    secret: '',
    publicKey: ''
  }
}
