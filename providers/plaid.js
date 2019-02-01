const moment = require('moment');
const _ = require('lodash');
const { fetchTransactions } = require('../lib/plaid');

exports.getTransactions = async (transactionColumns, categoryOverrides, currentMonthSheetTitle) => {
  const sanitizeTransaction = (transaction) => {
    let sanitized = transaction;

    /*
     * Explode out Plaid's object hierarchy.
     *
     * For example, the Category hierarchy comes as a list,
     * and the first two are usually the only interesting ones.
     *
     * Using defaultTransactionColumns above and _.get():
     *
     *    { "category": ["Food and Drink", "Restaurants"] }
     *
     * would get expanded to:
     *
     *    { "category.0": "Food and Drink", "category.1": "Restaurants" }
     */
    _.forEach(transactionColumns, (column) => {
      sanitized[column] = _.get(sanitized, column);
    });

    // Map TRUE to 'y' and FALSE to nothing (used for Pending column)
    sanitized = _.mapValues(sanitized, (p) => {
      let prop = p === true ? 'y' : p;
      prop = p === false ? '' : p;
      return prop;
    });

    // Handle category overrides defined in .env
    _.forEach(categoryOverrides, (override) => {
      if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(sanitized.name)) {
        sanitized['category.0'] = _.get(override, 'category.0', '');
        sanitized['category.1'] = _.get(override, 'category.1', '');
      }
    });

    return _.at(sanitized, transactionColumns);
  };

  const transactions = await fetchTransactions();
  const sorted = _.sortBy(transactions, 'date');
  const sanitized = _.map(sorted, sanitizeTransaction);
  const partitioned = _.partition(
    sanitized,
    transaction => moment(transaction.date)
      .startOf('month')
      .format('YYYY.MM') === currentMonthSheetTitle,
  );

  return partitioned;
};
