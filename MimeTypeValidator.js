const path = require('path')
const AdmZip = require('adm-zip')
const debug = require('debug')('botium-box-mimetypevalidatorvalidator')
const isBinaryFile = require('isbinaryfile').isBinaryFile

const mimeTypeFromFilename = require('mime-types')

// mmmagic: exits sometimes with error
// file-type: less clever
const Capabilities = {
  MIME_TYPE_VALIDATOR_PROCESSOR: 'MIME_TYPE_VALIDATOR_PROCESSOR'
}

// this mapping is not required anymore
const MAP_EXTENSION_TO_MIME_TYPE = {
  '.iml': 'text/xml',
  '.tgz': 'application/gzip',
  '.py': 'text/x-python'
}

const ACCEPTED_MAIN_MIMETYPES = [
  // favicon.ico, image/vnd.microsoft.icon, image/x-icon
  'image',
  'audio',
  'video',
  // application/x-gzip'. 'application/gzip
  // 'application'
]

const ACCEPTED_MIMETYPES = [
  'application/zip',
  // xlsx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const Defaults = {
  [Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]: 'mmmagic'
}

class MimeTypeValidator {
  constructor (args) {
    const fromEnv = {}
    if (process.env.BOTIUMBOX_MIME_TYPE_VALIDATOR_PROCESSOR) {
      fromEnv[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR] = process.env.BOTIUMBOX_MIME_TYPE_VALIDATOR_PROCESSOR
    }
    this.caps = Object.assign({}, Defaults, args ? args.caps : {}, fromEnv)
    // normalize falsy values
    if (this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR] === 'false' || this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR] === false) {
      this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR] = 'off'
    }
    debug(`MIME_TYPE_VALIDATOR_PROCESSOR: ${this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]}`)
  }

  async Validate () {
    switch (this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]) {
      case 'mmmagic':
      case 'file-type':
      case 'off':
        break
      default:
        throw new Error(`MimeTypeValidator, MIME_TYPE_VALIDATOR_PROCESSOR invalid: ${this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]}`)
    }
  }

  async Build () {
    switch (this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]) {
      case 'mmmagic': {
        const mmm = require('mmmagic')
        const Magic = mmm.Magic
        this.magic = new Magic(mmm.MAGIC_MIME_TYPE)
        break
      }
      case 'file-type':
        this.FileTypeValidator = require('./FileTypeValidator')
    }
  }

  async Clean () {
  }

  async ValidateMimeType (filename, filecontent) {
    let mimeTypeFilename = null
    let mimeTypeContent = null
    try {
      if (this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR] === 'off') {
        return { valid: true, filename, reason: 'Validation is turned off' }
      }
      if (!filename) {
        debug('Filename required!')
        return { valid: false, filename, error: 'Filename required', reason: 'Filename is not set' }
      }

      mimeTypeFilename = await this.GetMimeTypeFromFileName(filename)

      if (!filecontent) {
        return { valid: true, filename, mimeTypeFilename, reason: 'File is empty' }
      }
      const isBinary = await isBinaryFile(filecontent)

      if (!isBinary) {
        return { valid: true, filename, mimeTypeFilename, isBinary, reason: 'Text file' }
      }

      mimeTypeContent = await this.GetMimeTypeFromFileContent(filecontent, filename)
      if (!await this.isAcceptedMimeType(mimeTypeFilename, mimeTypeContent)) {
        return { valid: false, filename, mimeTypeFilename, mimeTypeContent, isBinary, reason: 'not accepted mimetype' }
      }

      let zip
      if (mimeTypeFilename === 'application/zip') {
        try {
          zip = new AdmZip(filecontent)
        } catch (err) {
          return { valid: false, filename, mimeTypeFilename, mimeTypeContent, reason: 'Zip invalid', isBinary }
        }
        const zipEntries = zip.getEntries()

        for (const zipEntry of zipEntries) {
          if (zipEntry.isDirectory) {
            return
          }
          const result = await this.ValidateMimeType(zipEntry.entryName, zipEntry.getData())
          if (!result.valid) {
            return result
          }
        }
      }
      return { valid: true, filename, mimeTypeFilename, mimeTypeContent, reason: 'mimetype accepted ' }
    } catch (err) {
      return { valid: false, filename, mimeTypeFilename, mimeTypeContent, error: err.message || err }
    }
  }

  async GetMimeTypeFromFileContent (filecontent, filename) {
    switch (this.caps[Capabilities.MIME_TYPE_VALIDATOR_PROCESSOR]) {
      case 'mmmagic':
        return new Promise((resolve, reject) => {
          this.magic.detect(filecontent, function (err, result) {
            if (err) {
              return reject(err)
            }
            return resolve(result)
          })
        })
      case 'file-type':
        return this.FileTypeValidator.fromBuffer(filecontent, filename)
    }
  }

  async GetMimeTypeFromFileName (filename) {
    const extension = path.extname(filename).toLowerCase()
    if (MAP_EXTENSION_TO_MIME_TYPE[extension]) {
      return MAP_EXTENSION_TO_MIME_TYPE[extension]
    }
    return mimeTypeFromFilename.lookup(filename)
  }

  async isAcceptedMimeType (mimeTypeFilename, mimeTypeContent) {
    // if ((mimeTypeContent === 'application/x-gzip' && mimeTypeFilename === 'application/gzip')) {
    //   return true
    // }

    if ((mimeTypeFilename === mimeTypeContent) && ACCEPTED_MIMETYPES.includes(mimeTypeContent)) {
      return true
    }

    const mainType = (mimeType) => mimeType && mimeType.substring(0, mimeType.indexOf('/'))

    const mimeTypeFilenameMain = mainType(mimeTypeFilename)
    const mimeTypeContentMain = mainType(mimeTypeContent)

    return (mimeTypeFilenameMain === mimeTypeContentMain) && ACCEPTED_MAIN_MIMETYPES.includes(mimeTypeContentMain)
  }
}

module.exports = {
  MimeTypeValidator,
  Capabilities
}
