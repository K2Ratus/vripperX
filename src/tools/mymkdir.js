const path = require('path');
const fs = require('fs');
const invalidWin32Path = require('./win32').invalidWin32Path
const o777 = parseInt('0777', 8);
const isWin32 = process.platform === 'win32'

const err_ENOTDIR = p => Object.assign(new Error(`ENOTDIR: Path is not directory, mkdirp: "${p}"`),{code:'ENOTDIR',path:p})
const err_EINVAL = p => Object.assign(new Error(`${p} contains invalid WIN32 path characters.`),{code:'EINVAL',path:p})

const mydirP = (p, opts, cb, made) => {
    const xfs = opts.fs || fs
    if (!made) made = null   
    xfs.mkdir(p, opts.mode, function (er) {
        if (!er) {
            made = made || p
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                if (!made) {
                    // remove one dir level and try again
                    mydirP(path.dirname(p), opts, (er, made) => {
                        if (er) return cb(er)
                        mydirP(p, opts, cb, made)
                    })
                }else{
                    cb(er)
                }
                break;                
            case 'EEXIST':
                xfs.stat(p, (er2, stat) => {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2) cb(er)
                    // return error it is not dir
                    if (!stat.isDirectory()) cb(err_ENOTDIR(p))
                    // return success it is dir
                    else cb(null, p);
                });                    
                break
            default:
                cb(er)
        }
    });
}

module.exports = (p, opts, f) => {
    if (typeof opts === 'function') {
        f = opts
        opts = {}
    } else if (opts && typeof opts !== 'object') {
        opts = { mode: opts }
    } else {
        opts = {}
    }
    p = path.resolve(p);
    opts.mode = opts.mode || o777 & (~process.umask())
    const cb = f || function () {}
    if (isWin32 && invalidWin32Path(p)) return cb(err_EINVAL(p))
    mydirP(p, opts, cb)
}
