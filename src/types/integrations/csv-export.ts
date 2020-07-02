import { BaseIntegrationConfig, IntegrationId, IntegrationType } from '../integrations'

export interface CSVExportConfig extends BaseIntegrationConfig {
    id: IntegrationId.CSVExport
    type: IntegrationType

    dateFormat: string

    transactionPath?: string
    balancePath?: string
}

export const defaultCSVExportConfig: CSVExportConfig = {
    name: 'CSV-Export',
    id: IntegrationId.CSVExport,
    type: IntegrationType.Export,

    transactionPath: '',
    balancePath: '',
    dateFormat: 'yyyy-MM-dd'
}
