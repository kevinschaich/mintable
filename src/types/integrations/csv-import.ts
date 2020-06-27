import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'
import { Transaction } from '../transaction'

export interface CSVImportConfig extends BaseIntegrationConfig {
  id: IntegrationId.CSVImport
  type: IntegrationType
}

export const defaultCSVImportConfig: CSVImportConfig = {
  name: 'CSV-import',
  id: IntegrationId.CSVImport,
  type: IntegrationType.Import,
}
