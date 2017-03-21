// # moduleRealSize.js
//
// Tries to figure out the real, minified size of each module.
// Only run trusted files, as this code executes the chunk’s code.
// Outputs to `data/module-size.json`

/* eslint no-eval: off */

const fs = require('fs')

{
  const {readStats} = require('../lib/io')
  const stats = readStats()
  const collector = createCollector()

  for (const asset of stats.assets) {
    if (asset.name.endsWith('.js') && asset.chunks.length) {
      console.log(`  * ${asset.name}`)
      const source = fs.readFileSync(`./data/assets/${asset.name}`, 'utf8')
      if (source.charAt(0) === '!') {
        console.log('      * Entry chunk')
        collector.collect(asset.name, parse(source, 0))
      } else {
        console.log('      * Non entry chunk')
        collector.collect(asset.name, parse(source, 1))
      }
    }
  }
  collector.write()
}

function createCollector () {
  const sizes = { }
  const collector = {
    collect (assetName, data) {
      sizes[assetName] = data
    },
    write () {
      console.log(`  * Writing to "data/sizes.json"`)
      fs.writeFileSync('data/sizes.json', JSON.stringify(sizes))
    }
  }
  return collector
}

function parse (source, argumentNumber) {
  source = source.replace(/;\s*(?:\/\/.+\s*)$/, '')
  const start = findArgumentList(source)
  let captured
  const capture = (...args) => {
    captured = args[argumentNumber]
  }
  void (0, eval)(
    `(capture => ((capture)
${source.substr(start)}
))`
  )(capture)
  const keys = Object.keys(captured)
  console.log(`      * ${keys.length} modules found`)
  const result = {}
  for (const key of keys) {
    if (typeof captured[key] === 'function') {
      result[key] = captured[key].toString().length
    }
  }
  return result
}

// A simple heuristics to find the position of argument list from the source.
//
// We want to find these:
//     webpackJsonp([2],{...})
//                 ^
//     !function(...){...}([...])
//                        ^
//
function findArgumentList (source) {
  let depth = 0
  let ready = true
  for (let i = 0; i < 8192; i++) {
    const ch = source.charAt(i)
    switch (ch) {
      case '!':
        if (depth === 0) {
          ready = false
        }
        break
      case '(':
        if (depth === 0 && ready) {
          return i
        }
        depth++
        break
      case ')':
        depth--
        if (depth === 0) {
          ready = true
        }
        break
      case '{':
        depth++
        break
      case '}':
        depth--
        break
    }
  }
  throw new Error('Cannot find argument list')
}
