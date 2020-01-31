enum IntegrationType {
  Import = 'import',
  Export = 'export'
}
enum IntegrationId {
  Plaid = 'plaid',
  Google = 'google'
}

interface BaseIntegrationConfig {
  id: IntegrationId
  name: string
  type: IntegrationType
}

enum PlaidEnvironmentType {
  Development = 'development',
  Sandbox = 'sandbox'
}
interface PlaidConfig extends BaseIntegrationConfig {
  id: IntegrationId.Plaid
  type: IntegrationType.Import

  environment: PlaidEnvironmentType

  clientId: string
  secret: string
  publicKey: string
}

interface GoogleTemplateSheetSettings {
  documentId: string
  sheetId: string
}
interface GoogleConfig extends BaseIntegrationConfig {
  id: IntegrationId.Google
  type: IntegrationType.Export
  oauthUrl: string

  template?: GoogleTemplateSheetSettings

  clientId: string
  clientSecret: string

  refreshToken?: string
  scope?: string
  tokenType?: string
  expiryDate?: string
}

type IntegrationConfig = PlaidConfig | GoogleConfig

enum PropertyType {
  Automated = 'automated',
  Manual = 'manual'
}

interface Property {
  id: string
  name: string
  type: PropertyType
}

interface BalanceProperty extends Property {}

interface TransactionPropertyOverride {
  sourcePropertyId: string // the other property to test on (e.g. "Title")
  match: RegExp // a regex to match (e.g. "*(Wegman's|Publix|Safeway)*")
  replace: RegExp // a regex to replace (e.g. "Grocery Stores")
  flags?: string // regex flags (e.g. "i" for case insensitivity)
}

interface TransactionProperty extends Property {
  overrides: TransactionPropertyOverride // override default values
}

interface BaseAccountConfig {
  name: string
  integration: IntegrationId
}

interface PlaidAccountConfig extends BaseAccountConfig {
  token: string
}

type AccountConfig = PlaidAccountConfig

interface BalanceConfig {
  enabled: boolean
  properties: PropertyType[]
}

interface TransactionConfig {
  enabled: boolean
  properties: PropertyType[]
}

interface Config {
  integrations: IntegrationConfig[]
  accounts: AccountConfig[]
  balances: BalanceConfig[]
  transactions: TransactionConfig[]
  debugMode: boolean
}
