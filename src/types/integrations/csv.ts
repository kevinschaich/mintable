import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface GoogleConfig extends BaseIntegrationConfig {
  id: IntegrationId.CSV
  type: IntegrationType

  path: string
}

export const defaultGoogleConfig: GoogleConfig = {
  name: '',
  id: IntegrationId.CSV,
  type: IntegrationType.Import,

  path: ''
}
