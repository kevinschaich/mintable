require('dotenv').config();

const { updateSheet } = require('../lib/sheets');

updateSheet([
  {
    range: 'A1',
    values: [['It worked!']]
  }
]);
