const path = require('path')
const magicMimetype = new Magic(mmm.MAGIC_MIME_TYPE)

const MAP_EXTENSION_TO_MIME_TYPE = {
  iml: 'text/xml'
}

const getMimeTypeFromFilecontent = async (filecontent) => {
  // return FileMagic.getInstance()
  // .then((magic) => {
  //   const version = magic.version();
  //   const major = ('' + version).charAt(0);
  //   const minor = ('' + version).substr(1);
  //   console.log(`Using magic version: ${major}.${minor}`);
  //   const result = magic.detect(filecontent, magic.flags | MagicFlags.MAGIC_MIME_TYPE)
  //   FileMagic.close()
  //   return result
  // })
}
  //   if (!isAccepted(mimeTypeFilename, resultMime)) {
  //     console.log(`${i++} ===> ${filename}, ${mimeTypeFilename}, ${resultMime}`)
  //     return {result: false}
  //   }
  // });



let i = 0
const validateExtension = async (filename, filecontent) => {
  if (!filecontent) {
    return {result: true}
  }
  if (!filename) {
    throw new Error('Filename required!')
  }
  // const mimeTypeContent = await FileType.fromBuffer(filecontent)
  const mimeTypeContent = await getMimeTypeFromFilecontent(filecontent)
  const mimeTypeFilename = getMimeTypeFromFilename(filename)
  if (!isAccepted(mimeTypeFilename, mimeTypeContent)) {
    console.log(`${i++} ===> ${filename}, name: ${mimeTypeFilename}, content: ${mimeTypeContent}`)
    return {result: false}
  }
  // magicMimetype.detect(filecontent, function (errMime, resultMime) {
  //   if (!isAccepted(mimeTypeFilename, resultMime)) {
  //     console.log(`${i++} ===> ${filename}, ${mimeTypeFilename}, ${resultMime}`)
  //     return {result: false}
  //   }
  // });

  return true
}

const fs = require('fs')

const res = './resources/validExtensions'
fs.readdirSync(res).forEach(file => {
  const content = fs.readFileSync(path.join(res, file))

  validateExtension(file, content).catch(ex => {
    console.log(`ex ===> ${require('util').inspect(ex)}`)
  })
});

