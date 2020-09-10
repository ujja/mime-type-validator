const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const MimeTypeValidator = require('./MimeTypeValidator')

const test = async () => {
  const validator = new MimeTypeValidator.MimeTypeValidator({caps: {
      // [MimeTypeValidator.PluginCapabilities.MIME_TYPE_VALIDATOR_PROCESSOR]: 'file-type'
      // [MimeTypeValidator.PluginCapabilities.MIME_TYPE_VALIDATOR_PROCESSOR]: 'off'
  }})
  await validator.Validate()
  await validator.Build()
  const filesGood = fs.readdirSync('./resources/good')
  console.log(`Processing ${filesGood.length} files`)
  let i = 0
  for (const file of filesGood) {
    const content = fs.readFileSync(path.join('./resources/good', file))
    await validator.ValidateMimeType(file, content).then((result) => {
      if (!result.valid) {
        console.log(`should be valid: ${i++} ===> ${JSON.stringify(result)}`)
      }
    }).catch(err => {
      console.log(err)
    })
  }
  const filesBad = fs.readdirSync('./resources/bad')
  console.log(`Processing ${filesBad.length} files`)

  i = 0
  for (const file of filesBad) {
    const content = fs.readFileSync(path.join('./resources/bad', file))
    await validator.ValidateMimeType(file, content).then((result) => {
      if (result.valid) {
        console.log(`should be invalid: ${i++} ===> ${JSON.stringify(result)}`)
      } else {
        console.log(`------------------ ${i++} ===> ${JSON.stringify(result)}`)
      }
    }).catch(err => {
      console.log(err)
    })
  }
  await validator.Clean()
}

test().catch(ex => {
console.log(`ex ===> ${require('util').inspect(ex)}`)
})


