require('dotenv').config();

const { updateSheet } = require('../lib/google/sheets');

updateSheet([
  {
    range: 'A1',
    values: [['It worked!']]
  }
]);
