// # analyze.js
//
// Prints the size chart for each chunk.

const {readStats} = require('../lib/io')
const stats = readStats()
const _ = require('lodash')
const fs = require('fs')
const sizes = require(fs.realpathSync('./data/sizes.json'))

for (const chunk of stats.chunks) {
  const name = chunk.names.length ? ` (${chunk.names.join(', ')})` : ''
  const sizeMap = { }
  for (const asset of stats.assets.filter(asset => asset.chunks.includes(chunk.id))) {
    Object.assign(sizeMap, sizes[asset.name])
  }
  console.log('Chunk ' + chunk.id + name)
  const modules = stats.modules.filter(m => m.chunks.indexOf(chunk.id) >= 0)
  const table = createStatTable(sizeMap)
  const [ours, vendor] = _.partition(modules, isModuleOurs)
  table.record('.', ours)
  const vendors = _.groupBy(vendor, m => {
    return nameOf(m).match(/~\/([^/]+)/)[1]
  })
  for (const v of Object.keys(vendors)) {
    table.record(v, vendors[v])
  }
  table.print()
}

function createStatTable (sizeMap) {
  const rows = [ ]
  const table = {
    record (name, modules) {
      rows.push({
        name,
        count: modules.length,
        size: _.sum(modules.map(m => sizeMap[m.id]))
      })
    },
    print () {
      const totalSize = _.sum(_.map(rows, 'size'))
      for (const row of _.sortBy(rows, 'name')) {
        console.log([
          '',
          row.name,
          row.count,
          row.size,
          (row.size * 100 / totalSize).toFixed(2) + '%'
        ].join('\t'))
      }
    }
  }
  return table
}

function isModuleOurs (m) {
  return !nameOf(m).startsWith('./~')
}

function nameOf (m) {
  return m.name.split('!').pop()
}
