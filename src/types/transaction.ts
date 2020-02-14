import {BaseProperty} from './common'

export interface TransactionPropertyOverride {
  sourcePropertyId: string    // the other property to test on (e.g. "Title")
  find: RegExp                // a regex to find matches of (e.g. "*(Wegman's|Publix|Safeway)*")
  replace: RegExp             // a regex to replace (e.g. "Grocery Stores")
  flags?: string              // regex flags (e.g. "i" for case insensitivity)
}

export interface TransactionProperty extends BaseProperty {
  overrides: TransactionPropertyOverride
}

export interface TransactionConfig {
  enabled: boolean
  properties: TransactionProperty[]
}
