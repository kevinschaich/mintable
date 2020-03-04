import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface GoogleTemplateSheetSettings {
  documentId: string
  sheetId: string
}

export interface GoogleCredentials {
  // oauthUrl: string
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

  credentials: GoogleCredentials
  documentId: string
  
  template?: GoogleTemplateSheetSettings
}

export const defaultGoogleConfig: GoogleConfig = {
  name: '',
  id: IntegrationId.Google,
  type: IntegrationType.Export,

  credentials: {
    // oauthUrl: '',
    clientId: '',
    clientSecret: ''
  },
  documentId: ''
}
