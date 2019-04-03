require('dotenv').config();

const readline = require('readline');
const oAuth2Client = require('../lib/google/googleClient');
const { getConfigEnv, writeConfigProperty } = require('./lib/common');

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/spreadsheets']
});

console.log('Authorize Google Sheets by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the code from that page here: ', code => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error while trying to retrieve access token', err);

    Object.keys(token).forEach(key => {
      writeConfigProperty(`SHEETS_${key.toUpperCase()}`, token[key]);
    });

    console.log(`Token stored in .env.`);
  });
});
