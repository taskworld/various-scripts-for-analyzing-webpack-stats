
const fs = require('fs')

exports.readStats = function readStats () {
  return require(fs.realpathSync('./data/webpack.stats.json'))
}
