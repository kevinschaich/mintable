# Mintable

## Disclaimer

All this repo does is talk to Plaid/Google APIs and write tokens to your local file system. If you don't feel safe entering real bank credentials, you can audit the code yourself and try it on Plaid's sandbox environment.

## Credits

Mintable started out as a fork of [Evan You](https://github.com/yyx990803)'s [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint) skeleton. Evan put together a great set of scripts to make the connection between Plaid and Google Sheets painless.

This repo is a lot more opinionated about defaults and gives you a real, working transaction spreadsheet out of the box. If you're looking for something very bare-bones to hack on, try [build-your-own-mint](https://github.com/yyx990803/build-your-own-mint).

## Setup

1. First things first - rename `.env.sample` to `.env`. Variables in this file will be loaded as environment variables. This file is ignored by Git.
1. Run `npm install` in the repo root.

### Plaid

- You will first need to sign up for [Plaid](https://plaid.com/) and apply for the development plan. You might need to wait for a day or two to get approved. It's free and limited to 100 items (i.e. banks), so it should be more than enough for your personal use.

- Once approved, fill out the following in `.env`:

  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_PUBLIC_KEY`

- Now you need to connect to your financial institutions to generate access tokens.

  Run `npm run token-plaid <account>` where `account` is an id for the bank you want to connect (it's for your personal reference, so you can name it anything). This will start a local server which you can visit in your browser and go through the authentication flow. Once you've linked the bank, its associated access token will be saved in `.env`.

  This process needs to be repeated for each bank you want to connect. Make sure to run each with a different `account` name.

- If you've done everything correctly, running `npm run test-plaid` now should log the recent transactions in your connected accounts.

### Google Sheets

- First, create a Google Sheets spreadsheet, and save its ID in `.env` as `SHEETS_SHEET_ID`.

- Then, go to [Google Sheets API Quickstart](https://developers.google.com/sheets/api/quickstart/nodejs), and click the "Enable the Google Sheets API" button. Follow instructions and download the credentials JSON file. Take a look at the file and fill in the following fields in `.env`:

  - `SHEETS_CLIENT_ID`
  - `SHEETS_CLIENT_SECRET`
  - `SHEETS_REDIRECT_URI` (use the first item in `redirect_uri`)

- Run `npm run token-sheets`. This will prompt for auth and save the token in `.env`.

- Now run `npm run test-sheets`. You should see your sheet's cell A1 with "It worked!".

## Usage

1. After completing the above steps, run `node index.js` in the repo root. If everything works, your spreadsheet should have been updated.

The logic for transforming raw Plaid transactions to Google Sheets cell data is defined in `index.js` – helpers can be found in the `lib` folder.

- This repo only handles transactions, but it should be pretty straightforward to add balances. (logic for fetching balances is in `plaid.js` already)

## Automate the Updates

The repo contains a [CircleCI](https://circleci.com/) config file which runs the update every day at 5AM UTC (midnight US Eastern time). You can adjust the cron config to tweak the time/frequency of the updates. Note that your local `.env` is not checked into the repo, so you will need to copy all those env variables into your CircleCI project settings.

This is totally optional if you don't trust CI with your tokens. Just run it manually when you want to update things.
