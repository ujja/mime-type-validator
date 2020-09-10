import moment from 'moment'
import git from 'git-rev-sync'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import replace from 'rollup-plugin-replace'
import obfuscatorPlugin from 'rollup-plugin-javascript-obfuscator'

const rollupPlugins = () => [
  resolve({
    only: [ 'botium-box-shared', 'license-creator' ]
  }),
  commonjs({
    exclude: 'node_modules/**',
    ignore: ['conditional-runtime-dependency']
  }),
  json({
    namedExports: false
  }),
  replace({
    exclude: 'node_modules/**',
    SET_BUILD_BRANCH: git.branch(),
    SET_BUILD_REVISION: git.long(),
    SET_BUILD_TIMESTAMP: moment().format()
  })
].concat([
  obfuscatorPlugin({
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    debugProtectionInterval: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: false,
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
  })
])

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/botium-box-server.js',
        format: 'umd',
        name: 'main',
        sourcemap: false
      }
    ],
    plugins: rollupPlugins()
  },
  {
    input: 'src/tools/livechat/livechatWorker.js',
    output: [
      {
        file: 'dist/botium-box-livechat-worker.js',
        format: 'umd',
        name: 'main',
        sourcemap: false
      }
    ],
    plugins: rollupPlugins()
  }
]
