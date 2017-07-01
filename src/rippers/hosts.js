'use strict'
const last = require('lodash/last')
const cheerio = require('cheerio')

// Cheerio $.text() mod
const RetText = (elems) => {
  let ret = '',len = elems.length

  for (let elem, i = 0; i < len; i++) {
    elem = elems[i];
    if (elem.type === 'text') ret += elem.data;
    else if (elem.children && elem.type !== 'comment' && elem.tagName !== 'script' && elem.tagName !== 'style') {
      ret += RetText(elem.children)
    }
  }

  return ret
}

// Search data in page elements, result boolean
const gGen = (elem, patt) => {
  return function(cobj){
    return patt.test(cobj(elem).text())
  }
}

// file name from url
const GenFromSRC = (elem, attr) => {
  return function(cobj){
    let name = cobj(elem).attr(attr)
      return name ? last(name.split('/')) : null
  }
}

// get attr value from element
const iGen = (elem, attr) => {
  return function(cobj){
    const elemObj = cobj(elem)
    if (elemObj.length>0){
      const txt = cobj(elem).attr(attr)
      return txt
    }
  }
}

// get form data by pinpointing element in form
const fGen = (elem) => {
  return (cobj, page) => {
    const form = {}
    const formdata = cobj(elem).closest('form')
    if (formdata.length>0){
      form.action = formdata.attr('action')
      form.method = formdata.attr('method')
      form.inputs = {}

      cobj('input', formdata).each((i,e) => {
        form.inputs[cobj(e).attr('name')] = cobj(e).val()
      });
      return form;
    }
  }
}

// get form data by pinpointing element in form
const CRC32Test = (flength,CRC, msg) => {
  return (out, resp, reject) => {
    //console.log(`out = ${JSON.stringify(out)}`)
    if (out.length == flength && out.crc32 === CRC) reject({message:msg, crc32:out.crc32})
  }
}

const hosts = {
      "365-img.com": {
        "sitegone": true
      },
      "acidimg.cc":  {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),		        			// get form data
        "https":    true
      },
      "ahcabron.info": {
        "sitegone": true
      },
      "anonpics.org": {
        "sitegone": true
      },
      "awsmpic.com": {
        "sitegone": true
      },
      "chronos.to": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/\bFile Not Found\b/),	                  		// Picture is gone
        "nohttps": true
      },
      "coreimg.net": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/File Not Found/)	  		                		// Picture is gone
      },
      "cuteimg.cc": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/File Not Found/)	        	            		// Picture is gone
      },
      "dimtus.com": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
      },
      "dragimage.org": {
        "sitegone": true
      },
      "ericsony.com": {
        "sitegone": true
      },
      "erimge.com": {
        "sitegone": true
      },
      "extinctimg.top": {
        "imagepath":function (){},						                				// dummy
      },
      "extraimg.org": {
        "sitegone": true
      },
      "fapat.me": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]')				        		// get form data
      },
      "fireimg.cc": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),			        		// get form data
      },
      "foxyimg.link": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/File Not Found/)	        	            		// Picture is gone
      },
      "gallerynova.se": {
        "sitegone": true
      },
      "gallerysense.se": {
        "sitegone": true
      },
      "gif-paradies.de": {
        "imagepath":function (){},						                				// dummy
      },
      "gogoimage.org": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "gone": gGen('p.error',/Image Removed or Bad Link/i)	    		// Picture is gone
      },
      "hosturimage.com": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),		      				// get form data
        "gone": gGen('p.error',/Image Removed or Bad Link/i)	    		// Picture is gone
      },
      "idolwall.com": {
        "sitegone": true
      },
      "ima.gy":  {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),			        		// get form data
        "gone": gGen('p.error',/Image Removed or Bad Link/i)	    		// Picture is gone
      },
      "image.re": {
        "sitegone": true
      },
      "imagebam.com": {
        "fileName": GenFromSRC('img.image','src'),  		          		// get file name from picture name from img element
        "imagepath":iGen('img.image','src'),                      		// get picture url from img element (absolute)
      },
      "imagecorn.com": {
        "sitegone": true
      },
      "imageeer.com": {
        "sitegone": true
      },
      "ImageFolks.com": {
        "sitegone": true
      },
      "imageon.org": {
        "sitegone": true									                      			// Internal server error long time
      },
      "imageontime.org": {
        "imagepath":function (){},								                		// dummy
        "gone": gGen('h1',/Image not found/)				                 	// Picture is gone
      },
      "imageophilia.com": {
        "sitegone": true
      },
      "imagesaholic.com": {
        "sitegone": true
      },
      "imageteam.org": {
        "fileName": iGen('img.centred,img.centred_resized','alt'),		// get picture name from img alt value
        "imagepath":iGen('img.centred,img.centred_resized','src'),		// get picture url from img element
        "gone": gGen('p.error',/Image Removed or Bad Link/i)		    	// Picture is gone
      },
      "imagetwist.com":{
        "fileName": iGen('img.pic','alt'),					            			// get picture name from img alt value
        "imagepath":iGen('img.pic','src'),				            				// get picture url from img element
        "gone": gGen('h4',/Image Not Found/i)				            			// Picture is gone
      },
      "imagevenue.com": {
        "fileName": GenFromSRC('img#thepic','alt'),  		        			// get file name from picture alt from img element
        "imagepath":iGen('img#thepic','src'),					            		// get picture url from img element (relative)
        "gone": function(cObj){
          const body = RetText(cObj('body')).replace(/\s+/g,' ')	  	// sometimes there is just empty pages
          return ((body.length == 1) || /This image does not exist/i.test(body))
        }
      },
      "imagezilla.net": {
        "fileName": iGen('img#photo','src'), 		 			            		// get file name from picture alt from img element
        "imagepath":iGen('img#photo','src'),					            		// get picture url from img element (relative)
        "gone": gGen('h2',/The requested image does not exist/)	  		// Picture is gone
      },
      "img-pay.com": {
        "sitegone": true
      },
      "img-zone.com": {
        "sitegone": true
      },
      "img.yt":  {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "gone": gGen('p',/This image has been removed/),              // Picture is gone
        "formpost": fGen('input[name=imgContinue]'),				        	// get form data
        "https":    true
      },
      "imgbig.com": {
        "sitegone": true
      },
      "imgcandy.net": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),				        	// get form data
        "gone": gGen('p.error',/Image Removed or Bad Link/),	    		// Picture is gone
      },
      "imgcherry.org": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
      },
      "imgbox.com": {
        "fileName": iGen('img#img','title'),				            			// get picture name from image alt element
        "imagepath":iGen('img#img','src'),						            		// get picture url from img element (absolute)
        "gone": gGen('div.boxed span',/does not exist/i),	       			// Picture is gone
      },
      "imgchili.com": {
        "fileName": iGen('img#show_image','alt'),				          		// get picture name from img alt value
        "imagepath":iGen('img#show_image','src'),			          			// get picture url from img element
        "gone": gGen('h1',/404/),						                    			// Picture is gone
        "imagetest": CRC32Test(5897,'f7d78320','Hotlinking Forbidden')
      },
      "imgchili.net": {
        "fileName": iGen('img#show_image','alt'),			          			// get picture name from img alt value
        "imagepath":iGen('img#show_image','src'),			          			// get picture url from img element
        "gone": gGen('h1',/404/),						                    			// Picture is gone
        "imagetest": CRC32Test(5897,'f7d78320','Hotlinking Forbidden')
      },
      "imgclick.net": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                     		// get form data
        "gone": gGen('b',/File Not Found/),	                  		 		// Picture is gone
      },
      "imgcoin.net": {
        "sitegone": true
      },
      "imgdevil.com": {
        "sitegone": true
      },
      "imgdino.com": {
        "fileName": iGen('img#cursor_lupa','alt'),	                  	// get picture name from image alt element
        "imagepath":iGen('img#cursor_lupa','alt'),	                  	// get picture url from img element (absolute)
        "gone": gGen('h1',/Error/)				 				                     	// Picture is gone
      },
      "imgdoggy.com": {
        "sitegone": true
      },
      "imgdragon.com": {
        "fileName": iGen('img.pic','alt'),					                   	// get picture name from img alt value
        "imagepath":iGen('img.pic','src'),				                   		// get picture url from img element
        "gone": gGen('b',/\bFile Not Found\b/),	                    		// Picture is gone
      },
      "imgease.re": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),			        		// get form data
      },
      "imgget.net": {
        "sitegone": true
      },
      "imggo.org": {
        "sitegone": true
      },
      "imglil.com": {
        "sitegone": true
      },
      "imgmaid.net": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/\bFile Not Found\b/)	                   		// Picture is gone
      },
      "imgmega.com": {
        "sitegone": true
      },
      "imgnimz.com": {
        "sitegone": true
      },
      "imgowk.com": {
        "sitegone": true,
      },
      "imgpack.com": {
        "sitegone": true
      },
      "imgpaying.com": {
        "sitegone": true
      },
      "imgrock.net": {
        "sitegone": true
      },
      "imgs.it": {
        "sitegone": true
      },
      "imgrex.com": {
        "sitegone": true										                       		// bullshit form
      },
      "imgsee.me": {
        "sitegone": true										                      		// bullshit form
      },
      "imgsen.se": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),			        		// get form data
      },
      "imgserve.net": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),	 	// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),  	// get picture url from img element (absolute)
        "gone": gGen('p.error',/Image Removed or Bad Link/)	       		// Picture is gone
      },
      "imgspice.com": {
        "fileName": function (cObj){
          const row = cObj('table.file_slot tr').first().find('td');
          if (row.length>0){
            const title = row.first().text()
            const name = row.last().text()
            if (/Filename/i.test(title)) return name
          }
        },
        "imagepath":iGen('img[id]','src'),
        "gone": gGen('b',/File Not Found/),	                    			// Picture is gone
      },
      "imgspot.org": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input#continuebutton'),					          	// get form data
        "gone": gGen('p.error',/Image Removed or Bad Link/)	       		// Picture is gone
      },
      "imgstudio.org": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "gone": gGen('p.error',/Image Removed or Bad Link/)	       		// Picture is gone
      },
      "imgtiger.com": {
        "imagepath":function (){},							                			// dummy
        "gone": gGen('h1',/Error/)					                					// Picture is gone
      },
      "imgtown.net": {
        "sitegone": true									                      			// bullshit form
      },
      "imgtrex.com": {
        "fileName": iGen('img.pic','alt'),                        		// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "gone": gGen('h2',/Image not found/)	                    		// Picture is gone
      },
      "imgtrial.com": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]'),			        		// get form data
      },
      "imgtube.net": {
        "sitegone": true
      },
      "imgvun.com": {
        "sitegone": true
      },
      "imgwel.com": {
        "sitegone": true
      },
      "imgzap.com": {
        "fileName": iGen('img#cursor_lupa','alt'),				        		// get picture name from image alt element
        "imagepath":iGen('img#cursor_lupa','src'),				        		// get picture url from img element (absolute)
        "gone": function(cObj){
          return (cObj('div#page_body div.text_align_center img').length==0)
        }
      },
      "k2s.cc": {
        "sitegone": true										                      		// hosting site actually, but no pictures available
      },
      "leechimg.com": {
        "sitegone": true
      },
      "mahometown.com":  {
        "imagepath":iGen('img.gallery-full-pic','src')                // get picture url from img element (absolute)
      },
      "mir.cr": {
        "sitegone": true											                      	// hosting site actually, but no pictures available
      },
      "myimg.club": {
        "fileName": iGen('img.pic','alt'),						            		// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),						            		// get picture url from img element (absolute)
        "formpost": fGen('input#continueButton'),				           		// get form data
        "gone": gGen('b',/\bFile Not Found\b/),	                  		// Picture is gone
      },
      "ocaload.com": {
        "imagepath":function (){},								                		// dummy
        "gone": gGen('p.error',/Image Removed or Bad Link/)	       		// Picture is gone
      },
      "pic-maniac.com": {
        "fileName": iGen('img.pic','alt'),	                        	// get picture name from image alt element
        "imagepath":iGen('img.pic','src'),	                        	// get picture url from img element (absolute)
        "formpost": fGen('input[name=next]'),	                    		// get form data
        "gone": gGen('b',/\bFile Not Found\b/)	                  		// Picture is gone
      },
      "picexposed.com": {
        "sitegone": true
      },
      "picpie.org": {
        "fileName": function(cobj){
          return cobj('h1.viewer-title').text()					            	// get picture name from header
        },
        "imagepath":function(cobj){
          return cobj('#image-viewer-container img').attr('src').replace(/.md.jpg$/i, '.jpg')
        }															                              	// get picture url from img element (absolute)
      },
      "picz.site": {
        "fileName": iGen('img.centred_resized,img.centred','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred_resized,img.centred','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input#continuebutton'),				          		// get form data
      },
      "pimpandhost.com": {
        "imagepath":function (){},									                	// dummy
        "gone": gGen('h1',/Image not found/)				                 	// Picture is gone
      },
      "pixhost.org": {
        "filename": function(cobj) {
          let html = $('h1').text()						                      	// get name from header
          html = (html) ? html.match(/\s*(.+?)\s+$/) : null          	// get name from last row
          return (html) ? html[1] : null					                  	// if there was error we return null
        },
        "imagepath": iGen('img.image-img','src'),	              			// get picture url from img element
        "gone": gGen('h2',/\bPicture doesn't exist\b/)		           	// Picture is gone
      },
      "pixroute.com": {
        "fileName": function (cObj){
          const row = cObj('table.file_slot tr').first().find('td');
          if (row.length>0){
            const title = row.first().text()
            const name = row.last().text()
            if (/Filename/i.test(title)) return name
          }
        },
        "imagepath":iGen('img[id]','src') 						            		// get picture url from img element (absolute)
      },
      "pixup.us":  {
        "fileName": iGen('img.centred,img.centred_resized2','alt'),		// get picture name from image alt element
        "imagepath":iGen('img.centred,img.centred_resized2','src'),		// get picture url from img element (absolute)
        "formpost": fGen('input[name=imgContinue]') 				        	// get form data
      },
      "postimage.org": {
        "imagepath":function (){}							                  			// dummy
      },
      "postimg.org": {
        "fileName": function(cObj){
          return RetText(cObj('span.imagename'))
        },
        "imagepath":iGen('img#main-image','src'),	                  	// get picture url from img element (absolute)
      },
      "radikal.ru": {
        "fileName": function (){return 'image'},
        "imagepath":function (cObj){
          let ret = ''
          cObj('div.mainBlock img').each((i,e) => {
            let att = e.attribs.src
            if (/^https?:/i.test(att)) ret = att
          });
          return ret
        },
        "gone": gGen('b',/Картинка не найдена/)				                 	// Picture is gone
      },
      "radioactiveimage.com":  {
        "fileName": function(cObj){
          return RetText(cObj('li.active'))
        },
        "imagepath":iGen('img.img-responsive','src')		            		// get picture url from img element (absolute)
      },
      "sharenxs.com": {
        "URLFix": function(url){								                    		// lets try get original size
          return url.replace(/\/(original|large|medium|small)$/i,'')+'/original'
        },
        "fileName": function(cobj){
          return cobj('div.photo_name span').first().text()		        	// element from above row
        },
        "imagepath":iGen('img.view_photo','src')				            		// get picture url from img element (relative)
      },
      "stooorage.com": {
        "sitegone": true
      },
      "turboimagehost.com": {
        "fileName": iGen('img.upimage','alt'),				            			// get picture name from image alt element
        "imagepath":iGen('img.upimage','src') 				            			// get picture url from img element (absolute)
      },
      "uploadrr.com": {
        "sitegone": true
      },
      "upurimg.com": {
        "sitegone": true
      },
      "xxxupload.org": {
        "sitegone": true
      }
    }

module.exports = hosts
