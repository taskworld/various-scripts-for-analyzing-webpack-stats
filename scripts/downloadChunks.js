// # download.js
//
// Downloads the assets into the `data` directory.

const {readStats} = require('../lib/io')
const {execSync} = require('child_process')

const publicPath = process.env.VARIOUS_SCRIPTS_PUBLIC_PATH

if (!publicPath) {
  throw new Error(
    'Set VARIOUS_SCRIPTS_PUBLIC_PATH environment variable to the publicPath (should be an absolute URL)'
  )
}

const stats = readStats()

require('mkdirp').sync('./data/assets')

for (const asset of stats.assets) {
  if (asset.name.endsWith('.js')) {
    if (asset.chunks.length) {
      console.log('  * Downloading chunk', asset.name)
      const command = `cd ./data/assets && curl -O "${publicPath}${asset.name}"`
      console.log('      $', command)
      execSync(command, {stdio: 'inherit'})
    }
  }
}
