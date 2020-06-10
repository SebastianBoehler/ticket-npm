const fetch = require('node-fetch')
const cheerio = require('cheerio')
var FormData = require('form-data')
const fs = require('fs')
var HttpsProxyAgent = require('https-proxy-agent');

async function source(proxy) {
    return new Promise((resolve, reject) => {
        var params = {}
        if (proxy) params['agent'] = new HttpsProxyAgent(proxy)
        fetch("https://www.supremenewyork.com/mobile.html", params).then(async resp => {
            if (resp.status !== 200) {
                reject('status code: ' + resp.status)
                return
            }
            const html = await resp.text()

            //console.log('getting wasm bin src')

            const a = cheerio.load(html)("script")
            for (var i in a)
                if ("script" === a[i].type && a[i].children && a[i].children && 1 === a[i].children.length) {
                    const t = a[i].children[0].data;
                    if (t.includes("wasmbinsrc")) {
                        const o = t.split('"')
                        for (var n in o) {
                            if (o[n].includes("https")) {
                                //console.log(o[n])
                                resolve(o[n])
                                break
                            }
                        }
                    }
                }
        }).catch(e => {
            console.log(e)
            reject(e)
        })
    })
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function rndString() {
    var tokens = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        chars = 5,
        segments = 4,
        keyString = "";

    for (var i = 0; i < segments; i++) {
        var segment = "";

        for (var j = 0; j < chars; j++) {
            var k = getRandomInt(0, 35);
            segment += tokens[k];
        }

        keyString += segment;

        if (i < (segments - 1)) {
            keyString += "-";
        }
    }

    return keyString;

}

module.exports = class TicketAPI {
    constructor(key) {
        this.key = key
    };

    setIPAddress(ip) {
        this.IPAddress = ip
    };

    setUserAgent(UA) {
        this.UA = UA
    };

    async startSession(proxy) {
        var isErrored = false

        if (!this.IPAddress) return 'ip address required'
        else if (!proxy) return 'proxy required'

        const wasmbinsrc = await source()
            .catch(e => {
                console.log(e)
                isErrored = true
            })

        if (isErrored) return

        var params = {
            method: 'POST',
            timeout: 2000
        }
        if (this.cookie) params['headers']['cookie'] = this.cookie
        //console.log('cookie used', params)
        //console.log('using proxy for _ticket checkout', this.proxy)
        return new Promise(async (resolve, reject) => {
            await fetch(wasmbinsrc, {
                    headers: {
                        "cache-control": "no-cache",
                        "pragma": "no-cache",
                        "referrer": "https://www.supremenewyork.com/mobile",
                        "Connection": "keep-alive"
                    },
                    timeout: 2500,
                    agent: new HttpsProxyAgent(proxy)
                })
                .then(async resp => {
                    const path = __dirname + `/${await rndString()}.wasm`
                    console.log('requested wasm')
                    var file = fs.createWriteStream(path)
                    file.on("error", (function (e) {
                        console.log(e)
                        return
                    }))
                    //console.log(resp.body)
                    await resp.body.pipe(file)

                    //fs.unlinkSync(db[a]['path'])

                    await sleep(550)

                    var upload = new FormData()
                    upload.append('wasm', fs.createReadStream(path));
                    upload.append('key', this.key);
                    //console.log('upload', upload)
                    fetch(`http://${this.IPAddress}/upload`, {
                            method: 'POST',
                            body: upload,
                            headers: params
                        })
                        .then(async resp => {
                            resp = await resp.json()
                            if (resp['success'])  {
                                this.session = resp['session']
                                resolve(resp)
                            }
                            else reject(resp)
                        })
                        .catch(err => {
                            reject(err)
                        })

                    fs.unlinkSync(path)
                }).catch(e => {
                    reject(e)
                })
        })
    }

    async generateTicket(cookies) {
        if (!this.IPAddress) return 'ip address required!'
        return new Promise(async (resolve, reject) => {
            const startTime = new Date()
            //console.log(this.key

            var body = {
                "userAgent": this.UA,
                "cookie": cookies,
                "key": this.key,
                "session": this.session
            }

            //console.log(this.session)
            var params = {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 2000,
                redirect: 'follow'
            }
            if (this.cookie) params['headers']['cookie'] = this.cookie

            //console.log('params for ticket endpoint', params)

            await fetch(`http://${this.IPAddress}/ticket`, params).then(async resp => {
                    //console.log(this.cookie)
                    if (resp.status === 503) {
                        //console.log(await resp.json())
                        reject(await resp.json())
                        return
                    }
                    try {
                        const cookie = resp.headers.get("set-cookie").split(';')[0]
                        this.cookie = cookie
                    } catch (error) {

                    }
                    resp = await resp.json()
                    this.session = resp['session']
                    const endTime = new Date()
                    //console.log('setting session after /ticket to', this.session)
                    resp['timing'] = (endTime.getTime() - startTime.getTime()) / 1000 + ' ms'
                    //console.log('Response time', resp['timing'])
                    resolve(resp)
                    //console.log(resp['_ticket'])
                    //_ticket = resp['_ticket']
                    //return _ticket
                })
                .catch(e => {
                    console.log('failed', e)
                    reject('failed')
                })
        })
    };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))