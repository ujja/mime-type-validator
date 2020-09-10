const path = require('path')

const isBinaryFile = require('isbinaryfile').isBinaryFile
const FileType = require('file-type')
const YAML = require('yaml')

const REMAP_MIME = {
  'application/x-gzip': 'application/gzip'
}

const YML_TO_CHECKER = {
  fnc: (filecontent) => {
    try {
      YAML.parse(filecontent.toString('utf8'))
      return 'text/yaml'
    } catch (err) {
      return false
    }
  }
}
const EXTENSION_TO_CHECKER = {
  '.json': {
    fnc: (filecontent) => {
      try {
        JSON.parse(filecontent.toString('utf8'))
        return 'application/json'
      } catch (err) {
        return false
      }
    }
  },
  '.yml': YML_TO_CHECKER,
  '.yaml': YML_TO_CHECKER,
  '.csv': {
    fnc: () => {
      // csv is to free to check it.
      return 'text/csv'
    }
  },
  '.md': {
    fnc: () => {
      // markdown is to free to check it.
      return 'text/markdown'
    }
  }
}

module.exports.fromBuffer = async (filecontent, filename) => {
  const result = await FileType.fromBuffer(filecontent)
  if (result) {
    return REMAP_MIME[result.mime] || result.mime
  }

  const extension = path.extname(filename).toLowerCase()

  const isBinary = await isBinaryFile(filecontent)

  if (!EXTENSION_TO_CHECKER[extension]) {
    return false
  }

  if (isBinary) {
    return 'something/evil'
  }

  return EXTENSION_TO_CHECKER[extension].fnc(filecontent) || 'something/evil'
}
