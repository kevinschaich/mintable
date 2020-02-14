import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface GoogleTemplateSheetSettings {
  documentId: string
  sheetId: string
}

export interface GoogleCredentials {
  oauthUrl: string
  clientId: string
  clientSecret: string

  refreshToken?: string
  scope?: string
  tokenType?: string
  expiryDate?: string
}

export interface GoogleConfig extends BaseIntegrationConfig {
  id: IntegrationId.Google
  type: IntegrationType.Export

  template?: GoogleTemplateSheetSettings

  credentials: GoogleCredentials
}
