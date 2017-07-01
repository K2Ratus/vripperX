'use strict'

const qRequest = require('./qRequest')
const trim = require('lodash/trim')
const last = require('lodash/last')
const fileType = require('file-type')
const crc = require('crc')
/**
 * Get filename from Content-Disposition header
 * @param {Object} headers
 * @returns {?string}
 */
const getFilenameFromHeaders = (headers) => {
  const contentDisposition = headers['content-disposition']
  if (contentDisposition) {
    const chunks = contentDisposition.split('filename=')
    if (chunks.length === 2) {
      return trim(chunks[1], '"')
    }
  }
}

/**
 * Get last part of path
 * e.g. 'foo/bar.jpg' => 'bar.jpg'
 * @param {string} path
 * @returns {string}
 */
const getFilenameFromPath = (path) => last(path.split('/'))

/**
 * @param {Object} options
 * @param {string} options.url
 * @param {number} [priority]
 * @returns {Promise.<{data: string|Buffer, name: string, ext: string, src: string}>}
 */
const download = (options, priority, testFn) => new Promise((resolve, reject) => {
  if (priority && typeof priority === 'function') {
    testFn = priority
    priority = undefined
  }
  options.encoding = null

  return qRequest(options, priority || 100).then((resp) => {
    const out = {data: resp.body, src: resp.request.href, length: resp.body.length}
    // Lets find CRC32 code of the file
    out.crc32 = crc.crc32(resp.body).toString(16) 

    if (testFn) testFn(out, resp, reject)
    if (resp.body.length < 10000) {
      return reject(`File too small, probably dummy, ${options.url}`)
    }
    const lastmod = resp.headers && resp.headers['last-modified']
    // File Last Modification time according the server
    out.mod = lastmod ? new Date(lastmod) : undefined
    // filename according server headers or request data
    out.name = getFilenameFromHeaders(resp.headers) || getFilenameFromPath(resp.request.path)
    const type = fileType(resp.body) 
    if (!type) {
      return reject(`Unknown file type, ${options.url}`)
    } else {
      out.ext = type.ext
    }
    return resolve(out)
  },e => {
      if (e.statusCode && (e.statusCode == 404 || e.statusCode == 403))
        e={
          source: 'download/qRequest/reject: statusCode check',
          err: `Image is gone, status code: ${e.statusCode}`,
          txt: e.err,
          statusCode: e.statusCode      
        }
      reject(e)
  })
})

module.exports = download
