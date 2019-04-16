# Providers APIs

Mintable is designed to be pluggable, i.e. you can swap out Plaid or Google Sheets for another service of your choice.

This document outlines what Mintable expects of a provider, and what constraints/functionality you need to adhere to/implement if you want to add a new provider.

## Transactions (`ACCOUNT_PROVIDER`) API

Account providers should provide an exported function which takes in a startDate and endDate, and returns a `Promise` of a raw list of transaction objects, i.e.:

```javascript
transactions = await require('../lib/providerName').fetchTransactions(startDate, endDate)
```

At minimum, we expect `name`, `date`, and `amount` to be defined.

For example, the following would an acceptable response (after promise resolution):

```javascript
[
    { "name": "Amazon.com", "date": "2019-04-16T07:00:00.000Z", "amount": -40.22 },
    { "name": "United Airlines", "date": "2019-04-06T07:00:00.000Z", "amount": -500 },
    { "name": "Uber", "date": "2019-04-04T07:00:00.000Z", "amount": -6.33 }
]
```

## Spreadsheets (`SHEET_PROVIDER`) API

Spreadsheet providers should provide an exported function which takes in a map of sheet name to a list of transactions for that sheet, and return a `Promise` which resolves when all necessary operations to update that sheet are complete, i.e.:

```javascript
await require('../lib/providerName').updateSheets(updates, options)
```

where `updates` come in the following format:

```javascript
{
    "2019.04": [
        { "name": "Amazon.com", "date": "2019.04.16", "amount": -40.22 },
        { "name": "United Airlines", "date": "2019.04.26", "amount": -500 }
    ],
    "2019.05": [
        { "name": "Uber", "date": "2019.05.11", "amount": -6.33 }
    ]
}
```
