<h4 align="center"><img width="200" src="./docs/logo.png" alt="Mintable"><h4 align="center">Automate your personal finances – for free, with no ads, and no data collection.</h4>

<br>

Mintable helps you:

- Keep track of your account balances
- Aggregate transactions from all your banking institutions, including checking accounts, savings accounts, and credit cards
- Analyze and budget your spending using a spreadsheet and formulas

<br>

[![](https://img.shields.io/travis/com/kevinschaich/mintable/master.svg)](https://travis-ci.com/kevinschaich/mintable)
[![](https://img.shields.io/github/release/kevinschaich/mintable.svg)](https://github.com/kevinschaich/mintable/releases)
[![](https://img.shields.io/github/license/kevinschaich/mintable.svg)](https://github.com/kevinschaich/mintable/blob/master/LICENSE)
[![](https://img.shields.io/github/issues/kevinschaich/mintable.svg)](https://github.com/kevinschaich/mintable/issues)
[![](https://img.shields.io/github/issues-pr/kevinschaich/mintable.svg)](https://github.com/kevinschaich/mintable/pulls)
[![](https://img.shields.io/reddit/subreddit-subscribers/Mintable?style=social)](https://reddit.com/r/Mintable)

---

## Quickstart

1. Sign up for [Plaid's Free Plan](https://plaid.com/pricing/) (limited to 100 banking institutions).
2. Run through the automated setup:

```bash
git clone https://github.com/kevinschaich/mintable
cd mintable
yarn
yarn setup
```

3. Update your transactions:

```
yarn mintable
```

> **Note:** If you're already a version `1.x.x` user, you can run `yarn migrate` to upgrade to version `2.x.x`.

## RTFM

- [Quickstart](#quickstart)
- [Full Documentation](./docs/OVERVIEW.md)
- [FAQs](#FAQs)
- [Alternatives](#Alternatives)

## FAQs

**WTF is 'Mintable'?!**

> **min·ta·ble**: _noun._
> 1. An open-source tool to automate your personal finances – for free, with no ads, and no data collection. Derived from *mint* (the [wildly popular personal finance app from Intuit](https://www.mint.com/)) + *table* (a spreadsheet).

**Do I have to use Google Sheets/Plaid?**

Nope. You can import/export your transactions to/from CSV files (coming soon).

**Do I have to manually run this every time I want new transactions in my spreadsheet?**

Nope. You can automate updates using CI for free.

**It's not working!**

- [File an issue](https://github.com/kevinschaich/mintable/issues) or  [![](https://img.shields.io/reddit/subreddit-subscribers/Mintable?style=social)](https://reddit.com/r/Mintable).

## Alternatives

- [**Money in Excel**](https://www.microsoft.com/en-us/microsoft-365/blog/2020/06/15/introducing-money-excel-easier-manage-finances/): Recently announced partnership between Microsoft/Plaid. Requires a Microsoft 365 subscription ($70+/year).
- [**Mint**](https://www.mint.com/): Owned by Intuit (TurboTax). Apps for iOS/Android/Web.
- [**build-your-own-mint**](https://github.com/yyx990803/build-your-own-mint): Some assembly required. More flexible.
