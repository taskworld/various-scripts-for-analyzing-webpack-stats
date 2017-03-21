
const _ = require('lodash')
const data = require('./webpack.standalone.stats.json')

for (const chunk of data.chunks) {
  const name = chunk.names.length ? ` (${chunk.names.join(', ')})` : ''
  console.log('Chunk ' + chunk.id + name)
  const modules = data.modules.filter(m => m.chunks.indexOf(chunk.id) >= 0)
  const [ ours, vendor ] = _.partition(modules, isModuleOurs)
  console.log(`  - Our modules: ${ours.length}`)
  console.log(`  - Vendor modules: ${vendor.length}`)
  const vendorCount = _.groupBy(vendor, m => {
    return nameOf(m).match(/~\/([^\/]+)/)[1]
  })
  for (const v of Object.keys(vendorCount).sort()) {
    console.log('      -', v, `(${vendorCount[v].length})`)
  }
}

function isModuleOurs (m) {
  return !nameOf(m).startsWith('./~')
}

function nameOf (m) {
  return m.name.split('!').pop()
}
