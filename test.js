const { sleep } = require('.')

console.time('sleep')
sleep().then(() => console.timeEnd('sleep'))
