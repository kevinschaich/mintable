import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface GoogleTemplateSheetSettings {
  documentId: string
  sheetTitle: string
}

export interface GoogleCredentials {
  clientId: string
  clientSecret: string
  redirectUri: string

  accessToken?: string
  refreshToken?: string
  scope?: string[]
  tokenType?: string
  expiryDate?: number
}

export interface GoogleConfig extends BaseIntegrationConfig {
  id: IntegrationId.Google
  type: IntegrationType.Export

  credentials: GoogleCredentials
  documentId: string

  dateFormat?: string

  // Whether to export all transactions to a single sheet. Defaults to false (transactions are split by month)
  exportToSingleSheet?: boolean
  // If `exportToSingleSheet` is true, this controls the name of the exported sheet. Defaults to "Transactions"
  singleSheetName?: string

  template?: GoogleTemplateSheetSettings
}

export const defaultGoogleConfig: GoogleConfig = {
  name: '',
  id: IntegrationId.Google,
  type: IntegrationType.Export,

  credentials: {
    clientId: '',
    clientSecret: '',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  },
  documentId: ''
}
