'use strict'

const _ = require('lodash')
const URL = require('url')
const cheerio = require('cheerio')
const qRequest = require('../tools/qRequest')
const download = require('../tools/download')
const hosts = require('./hosts.js')

// PRESETS:
const namePrefixed = [
  'imagevenue',
  'imagezilla',
  'pixhost',
  'stooorage',
  'imgchili',
  'sharenxs'
]
const nameSuffixed = [
  'dumppix'
]

/**
 * Helper
 * @param {string} target
 * @param {string|RegExp} pattern
 */
const test = (target, pattern) => pattern.test ? pattern.test(target) : target.includes(pattern)

/**
 * Ensure extension and remove prefix and(or) suffix
 * @param {string} name
 * @param {string} ext
 * @param {string} hosting
 * @returns {string}
 */
const fixName = (name, ext, hosting) => {
  // remove prefix
  for (let prefixRule of namePrefixed) {
    if (test(hosting, prefixRule)) {
      name = name.replace(/^[^-_]+[-_]/, '')
      break
    }
  }
  // remove suffix
  for (let suffixRule of nameSuffixed) {
    if (test(hosting, suffixRule)) {
      name = name.replace(/,[^,]+$/, '')
      break
    }
  }
  // ensure extension
  if (!/\.\w{3,5}$/.test(name)) {
    name += '.' + ext
  }
  return name
}

/**
 * Torture image hosting
 * @param {string} hostingUrl
 * @returns {Promise}
 */
const resolveFromHosting = (DataObjIn) => new Promise((resolve, reject) => {
  const {parsedURL,hostData} = DataObjIn
  if (hostData.URLFix) hostData.URLFix(parsedURL)
  if (hostData.nohttps) parsedURL.protocol = 'http'
  if (hostData.https) parsedURL.protocol = 'https'
  const hostingUrl = URL.format(parsedURL).replace(/=(&|$)/g, '$1') // handle '?a=' and '?a=&b=1' cases
  if (parsedURL.path === '/') return reject({
    source: 'ImageHosting/resolve/fetchPage: form existence check',
    message: 'Link seems to be too generic',
    link: hostingUrl
  })
  let depth = 0
  const fetchPage = (formData) => {
    const headers = {Accept: 'text/html,application/xhtml+xml,application/xml'}
    const requestData = {headers}
    requestData.url = formData ? URL.resolve(hostingUrl, formData.action) : hostingUrl
    requestData.method = formData ? formData.method : 'GET'
    if (formData && formData.inputs) requestData.form = formData.inputs
    requestData.followAllRedirects = true
    qRequest(requestData, depth).then((resp) => {
      const href = resp.request.href
      const $ = cheerio.load(resp.body)
      if (hostData.gone && hostData.gone($, resp)){
        return reject({
          source: 'ImageHosting/resolve/fetchPage: link is dead',
          message: 'This, link is Dead',
          link: hostingUrl
        })
      }
      let gogogo = 0;
      if (hostData.formpost){
        const newFormData = hostData.formpost($, resp.body)
        if (newFormData){
          if (depth < 10) {
            depth += 1
            fetchPage(newFormData)
            gogogo++
          } else 
            return reject({
              source: 'ImageHosting/resolve/fetchPage: form existence check',
              message: 'form seems going, nowhere',
              link: hostingUrl,
              depth: depth,
              page: resp.body            
            })
        }
      }
      if (gogogo == 0) {   
        const outData = {href}
        outData.src = hostData.imagepath($)
        if (!outData.src)
          return reject({
            source: 'ImageHosting/resolve/fetchPage: get image location',
            message: "didn't find image",
            link: hostingUrl, 
            depth: depth,          
            page: resp.body
          })
        outData.src = URL.resolve(href, outData.src)
        if (hostData.fileName)
          outData.name = hostData.fileName($)
        return resolve(outData)
      }
    }, reject)
  }
  fetchPage(null)
})

/**
 * @param {string} hostingURL
 * @param {string} [thumbURL]
 * @param {boolean} [forceOriginalName]
 * @returns {Promise.<{src: string, name:string, data: Buffer}>}
 */
const resolvee = (hostingURL, thumbURL, forceOriginalName) => {
  thumbURL = thumbURL || ''
  //const fromThumbName = getNameFromThumb(thumbURL) || getNameFromHosting(hostingURL)
  const parsedURL = URL.parse(hostingURL, true, true)

	// domain names in array, format ["google.com", "google"]
	parsedURL.domain = (parsedURL.hostname)?parsedURL.hostname.match(/([^.]+)\.[^.]+$/):null;

  if (!hosts.hasOwnProperty(parsedURL.domain[0]))
    return Promise.reject({
          source: 'ImageHosting/resolve/hosts: domain check',
          message: `Domain "${parsedURL.domain[0]}" is not supported`,
          URL: parsedURL
    })

//  console.log(`host = ${parsedURL.domain[0]}`)

  const hostData = hosts[parsedURL.domain[0]]

  if (hostData.sitegone)
    return Promise.reject({
          source: 'ImageHosting/resolve/hosts: domain check',
          message: "This domain doesn't exist anymore",
          URL: parsedURL
    })
  
  //const fromThumbSrc = (parsedURL.domain[1] != 'chronos')? getSrcFromThumb(thumbURL) : undefined;

  //const ress = {hostingURL, parsedURL, thumbURL, forceOriginalName, fromThumbSrc, fromThumbName}
  //console.log(`ImageHosting resolve ${JSON.stringify(ress,null,1)}`)

  const loadFromHosting = () => resolveFromHosting({hostingURL,parsedURL,hostData})
    .then(
      (img) => {
        //console.log(`loadFromHosting(img) = ${img}`)
        return download({url: img.src,headers: { Referer: img.href }}, hostData.imagetest)
      .then(
        file => Object.assign(file,{name: fixName(img.name || fromThumbName || file.name, file.ext, hostingURL)})
      )
    })

  const loadFromThumb = () => download({url: fromThumbSrc,headers: { Referer: hostingURL }}).then(
    file => Object.assign(file,{ name: fixName(img.name || fromThumbName || file.name, file.ext, hostingURL) })
  )

  const TaskData = file => Object.assign(file,{name: fixName(img.name || fromThumbName || file.name, file.ext, hostingURL)})


//  if (fromThumbSrc && (!forceOriginalName || fromThumbName)) {
//    return loadFromThumb().then((x) => x, loadFromHosting)
//  } else if (fromThumbSrc) {
//    return loadFromHosting().then((x) => x, loadFromThumb)
//  } else {
    return  loadFromHosting()
//  }
}

module.exports = resolvee
