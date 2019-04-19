# Configuration

All configurations below can be made using the web configuration framework or by editing `mintable.config.json`.

`mintable.config.json` is the secret sauce – it contains all of your private tokens and is never sent to third-party servers. This file is ignored by Git – keep a backup somewhere safe.

> **Pro Tip:** You can use Dropbox or another trusted service to sync `mintable.config.json` across your machines. Run `ln -s <path_to_cloud_folder>/mintable.config.json .` from the repo root to symlink Mintable to the cloud version.

### Automate Updates with a CI Provider

This repo includes config files for both [CircleCI](https://circleci.com/) and [Travis CI](https://travis-ci.com) to run builds automatically.

Most CI providers allow you to set **environment variables** to configure sensitive information (like the stuff in `mintable.config.json`). We've included a handy script to get that set up:

```
yarn export
```

Run this command and paste the result into an environment variable called `MINTABLE_CONFIG` in your CI provider of choice. Mintable will handle the rest.

> **Note:** Some CI providers (like Travis) require you to wrap this variable in single quotes, i.e. `'{ "ACCOUNT_PROVIDER": "plaid", ...}'`. If you get an error similar to `Unable to parse JSON...` when you run your CI build, give this a try.

> **Warning:** If you choose to use CircleCI, you should turn off **Pass secrets to builds from forked pull requests** under **Build Settings** > **Advanced Settings**.

### Start Date

`START_DATE` specifies the lower bound for fetching transactions in `YYYY.MM.DD` format.

**Default:**

```javascript
"START_DATE": undefined // If end date is not specified, Mintable will fetch the last 2 months of transactions
```

For example, if you only want to fetch transactions which occur after or on December 1, 2018, you could add the following line to your `mintable.config.json` file:

```javascript
"START_DATE": "2018.12.01"
```

### End Date

`END_DATE` specifies the upper bound for fetching transactions in `YYYY.MM.DD` format.

**Default:**

```javascript
"END_DATE": undefined // If end date is not specified, Mintable will fetch up until the current date
```

For example, if you only want to fetch transactions which occur before or on December 1, 2018, you could add the following line to your `mintable.config.json` file:

```javascript
"END_DATE": "2018.12.01"
```

### Host

`HOST` specifies the host for Mintable's setup server.

**Default:** 

```javascript
"HOST": "localhost"
```

For example, if you want to run Mintable on a custom server and listen on `0.0.0.0`, you could add the following line to your `mintable.config.json` file:

```javascript
"HOST": "0.0.0.0"
```

### Port

`PORT` specifies the port for Mintable's setup server.

**Default:** 

```javascript
"PORT": 3000
```

For example, if you already have an application running on port `3000` and instead want to use port `8080`, you could add the following line to your `mintable.config.json` file:

```javascript
"PORT": "8080"
```

### Transaction Columns

`TRANSACTION_COLUMNS` specifies a list of transaction properties (using [`_.get()` syntax](https://lodash.com/docs/4.17.11#get)) to automatically update in your spreadsheet. All the contents of these columns will be cleared and overwritten each time you run Mintable.

**Default:** 

```javascript
"TRANSACTION_COLUMNS": [ 'date', 'amount', 'name', 'account_details.official_name', 'category.0', 'category.1', 'pending' ]
```

For example, if you only want to auto-populate the name and amount for each transaction, you could add the following line to your `mintable.config.json` file:

```javascript
"TRANSACTION_COLUMNS": ["name", "amount"]
```

### Reference Columns

`REFERENCE_COLUMNS` specifies a list of additional, non-automated columns for your reference/bookkeeping purposes. Each time you run Mintable, the contents of these columns will be preserved.

**Default:** 

```javascript
"REFERENCE_COLUMNS": ['notes', 'work', 'joint']
```

For example, if you want to add one column to track work expenses, and another to track joint expenses shared with a partner, you could add the following line to your `mintable.config.json` file:

```javascript
"REFERENCE_COLUMNS": ["work", "joint"]
```

> **Warning:** Since reference columns are not automated by Mintable, they have the potential to get out of sync with transaction data (for example, if your bank deletes a transaction, causing a row to get removed in `TRANSACTION_COLUMNS`)

### Account Provider

`ACCOUNT_PROVIDER` specifies which service to use to fetch transactions.

**Default:** 

```javascript
"ACCOUNT_PROVIDER": "plaid"
```

### Spreadsheet Provider

`SHEET_PROVIDER` specifies which service to use to automate spreadsheet updates.

**Default:** 

```javascript
"SHEET_PROVIDER": "sheets" // "sheets" = Google Sheets
```

# Provider-Specific Configuration

You can see the API definitions for account & spreadsheet providers in the **[provider docs](./docs/PROVIDERS.md)**.

## Plaid

### Category Overrides

`CATEGORY_OVERRIDES` specifies a list of overrides to handle transactions that are routinely miscategorized by Plaid's servers.

**Default:** 

```javascript
"CATEGORY_OVERRIDES": []
```

Overrides take the following format:

* `pattern`: [JavaScript Regular Expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Syntax) to test transaction names against
* `flags`: [JavaScript Regular Expression flags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Syntax) (i.e. `i` for case insensitive)
* `category.0`: Override for first (top-level) category
* `category.1`: Override for second (level-2) category

For example, if you want anything matching `autopay` or `e-payment` to get categorized as `Credit Card Payment`, you could add the following lines to your `mintable.config.json` file:

```javascript
"CATEGORY_OVERRIDES": [
    {
        "pattern": ".*(autopay|e.payment).*",
        "flags": "i",
        "category.0": "Transfer",
        "category.1": "Credit Card Payments"
    }
]
```

## Google Sheets

### Template Sheet

`TEMPLATE_SHEET` specifies the template spreadsheet to use when creating a _new_ sheet for a month.

**Default:** 

```javascript
"TEMPLATE_SHEET": {
     // Public template: https://docs.google.com/spreadsheets/d/10fYhPJzABd8KlgAzxtiyFN-L_SebTvM8SaAK_wHk-Fw
    "SHEET_ID": "10fYhPJzABd8KlgAzxtiyFN-L_SebTvM8SaAK_wHk-Fw",
    "SHEET_TITLE": "Template"
}
```

* `SHEET_ID`: Google Sheets spreadsheet ID (from the URL: `docs.google.com/spreadsheets/d/`**`sheet_id`**`/edit`)
* `SHEET_TITLE`: Title of the sheet (along the bottom row of the document)

For example, you could add the following lines to your `mintable.config.json` file:

```javascript
"TEMPLATE_SHEET": {
    "SHEET_ID": "10fYhPJzABd8KasbqiyFN-L_SebTvM8SaAK_wHk-Fw",
    "SHEET_TITLE": "My Template Sheet"
}
```
