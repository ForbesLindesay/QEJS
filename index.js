module.exports = process.env.EXPRESS_COV
    ? require('./lib-cov/qejs')
    : require('./lib/qejs');