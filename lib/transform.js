const moment = require('moment');
const _ = require('lodash');

exports.transformTransactionsToUpdates = (sheetTitle, transactions, properties, firstCol, lastCol) => {
  const updates = _.map(transactions, (transaction, i) => {
    return {
      range: `${sheetTitle}!${firstCol}${i + 2}:${lastCol}${i + 2}`,
      values: [_.map(properties, (property) => {
        let value = _.get(transaction, property, '');
        value = value === true ? 'Y' : value;
        value = value === false ? null : value;
        return value;
      })]
    }
  })

  updates.push({
    range: `${sheetTitle}!${firstCol}1:${lastCol}1`,
    values: [properties]
  })

  return updates
}
