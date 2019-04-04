exports.sleep = function sleep(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.isFile = function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch (e) {
    if (e.code !== 'ENOENT') throw e // File might exist, but something else went wrong (e.g. permissions error)
    return false
  }
}
