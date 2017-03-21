// # moduleRealSize.js
// Tries to figure out the real, minified size of each module.
//
// ## Input
//
// - `./webpack.stats.json`
// - `./assets/*.js`

const fs = require('fs')
const _ = require('lodash')
const data = require('./webpack.stats')
const babylon = require('babylon')

for (const asset of data.assets) {
  if (asset.chunks.length) {
    if (asset.name.startsWith('0-') && asset.name.endsWith('.js')) {
      console.log(asset.name)
      const js = fs.readFileSync('assets/' + asset.name, 'utf8')
      const parsed = babylon.parse(js)
      process(parsed, {
        bail (reason) {
          console.log('  ! Skipping:', reason)
        },
        log (message) {
          console.log('  *', message)
        },
        warn (message) {
          console.warn('  # Warning:', message)
        }
      })
    }
  }
}

function makeRef (value, name) {
  return {
    value,
    path: name,
    sub (path) {
      return makeRef(_.get(value, path), name + '.' + path)
    }
  }
}

function process (parsed, { bail, log, warn }) {
  const astRef = makeRef(parsed, 'AST')
  return guard(
    equals(astRef, 'program.body.length', 1),
    equals(astRef, 'program.body.0.type', 'ExpressionStatement'),
    () => {
      const expressionRef = astRef.sub('program.body.0.expression')
      const expression = expressionRef.value
      if (expression.type === 'UnaryExpression') {
        return processEntryChunk(expressionRef)
      } else if (expression.type === 'CallExpression') {
        return processChunk(expressionRef)
      } else {
        return bail('Unrecognized expression type ' + expression.type)
      }
    }
  )
  function processEntryChunk (expressionRef) {
    log('Entry chunk detected')
    return guard(
      equals(expressionRef, 'argument.type', 'CallExpression'),
      equals(expressionRef, 'argument.arguments.length', 1),
      () => {
        const argumentRef = expressionRef.sub('argument.arguments.0')
        return processModuleList(argumentRef)
      }
    )
  }
  function processChunk (expressionRef) {
    log('Non-entry chunk detected')
    return guard(
      equals(expressionRef, 'arguments.length', 2),
      () => {
        const argumentRef = expressionRef.sub('arguments.1')
        return processModuleList(argumentRef)
      }
    )
  }
  function processModuleList (argumentRef) {
    const list = argumentRef.value
    if (list.type === 'ArrayExpression') {
      return processArray()
    } else if (list.type === 'ObjectExpression') {
      return processObject()
    } else {
      return bail(argumentRef.path + ' should be ArrayExpression or ObjectExpression')
    }
    function processArray () {
      const modules = [ ]
      for (let i = 0; i < list.elements.length; i++) {
        const id = i
        const m = list.elements[i]
        if (m) {
          if (m.type === 'FunctionExpression') {
            modules.push({ id, size: m.end - m.start })
          } else {
            warn('Module content not a FunctionExpression')
          }
        }
      }
      return modules
    }
    function processObject () {
      const modules = [ ]
      for (let i = 0; i < list.properties.length; i++) {
        const propertyRef = argumentRef.sub('properties.' + i)
        const property = propertyRef.value
        if (property.key.type === 'Literal' || property.key.type === 'NumericLiteral') {
          const id = property.key.value
          const m = property.value
          if (property.value.type === 'FunctionExpression') {
            modules.push({ id, size: m.end - m.start })
          } else {
            warn(propertyRef.sub('value.type').path + ': not a FunctionExpression')
          }
        } else {
          warn(propertyRef.sub('key.type').path + ': not a NumericLiteral or Literal')
        }
        return modules
      }
    }
  }
  function guard (...args) {
    const result = args.pop()
    const conditions = args
    for (const condition of conditions) {
      if (condition !== true) {
        return bail(condition)
      }
    }
    return result()
  }
  function equals (source, path, expected) {
    const ref = source.sub(path)
    const actual = ref.value
    return actual === expected || `Expected ${ref.path} to be "${expected}", got "${actual}"`
  }
}
