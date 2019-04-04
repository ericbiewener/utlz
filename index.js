const fs = require('fs')
const path = require('path')

function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch (e) {
    if (e.code !== 'ENOENT') throw e // File might exist, but something else went wrong (e.g. permissions error)
    return false
  }
}

function readDirFilesSync(dir) {
  const items = []
  
  for (const name of fs.readdirSync(dir)) {
    const filepath = path.join(dir, name)
    if (!isFile(filepath) || name === '.DS_Store') continue
    items.push({ filename: name, filepath })
  }

  return items
}

module.exports = {
  sleep,
  isFile,
  readDirFilesSync,
}
