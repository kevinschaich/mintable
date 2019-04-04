<h4 align="center"><img width="200" src="./src/static/logo.png" alt="Mintable"><h4 align="center">Roll-your-own Mint clone for managing personal finances using (by default) the Google Sheets and Plaid APIs.</h4><br></h4>

## Quickstart

```bash
git clone https://github.com/kevinschaich/mintable.git
cd mintable
yarn
yarn setup
```

> **Note**: If you started using Mintable before `v1.0.0`, run `yarn migrate` to migrate to the new web-based configuration framework.

## Overview

![Mintable](./src/static/mintable.png)

Mintable allows you to automatically populate transaction data from your financial institutions into a spreadsheet for analysis and visualization. Here's how it works:

1. You connect your accounts (default provider: Plaid) and a spreadsheet provider (default provider: Google Sheets) to Mintable.
1. Mintable automates the connection to financial institutions and populates new transactions as they occur.
1. Each month, Mintable will use the current month's sheet as the "base" for the next month, keeping all the formatting and calculations on top of your data intact.

You can see a full list of options in the [Config Docs](./docs/CONFIG.md).

## FAQs

**How is this different from [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint)?**

* [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint) is an awesome set of scripts that makes the integration between Plaid and Google Sheets painless. It makes no assumptions about what you want your spreadsheet to look like or how updates should be handled each month, and allows you to define your own logic in [`transform.js`](https://github.com/yyx990803/build-your-own-mint/blob/master/lib/transform.js) to map transactional data to cell updates.
* [Mintable](#) enforces a specific spreadsheet layout (transactions flow in on the left and overwrite certain columns, while you are free to do analysis on the right). It creates a new sheet for every month and uses the previous month's sheet as a template, giving you a working end-to-end analytics toolkit out of the box if you use the [Template Sheet](#updating-your-template-sheet) above. [Mintable](#) relies on some of the same scripts used in [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint) and you can examine the additional logic yourself in [`mintable.js`](https://github.com/kevinschaich/mintable/blob/master/mintable.js) and [`lib/sheets.js`](https://github.com/kevinschaich/mintable/blob/master/lib/sheets.js) to determine if it fits your needs. The end goal would be to accept contributions for a *variety* of other Template Sheets above which follow the same format – making them completely plug-and-play.

**Do I have to give my data to Plaid and Google? Are there any completely self-hosted alternatives I can use?**

It's pluggable! Plaid & Sheets are working right now – but contributions are welcome for other providers!

## Credits

Mintable initially started as a fork of [Evan You](https://github.com/yyx990803)'s [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint).
