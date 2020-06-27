import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface CSVExportConfig extends BaseIntegrationConfig {
  id: IntegrationId.CSVExport
  type: IntegrationType

  outputPath: string
}

export const defaultCSVExportConfig: CSVExportConfig = {
  name: 'CSV-Export',
  id: IntegrationId.CSVExport,
  type: IntegrationType.Export,

  outputPath: '',
}
