const fetch = require('node-fetch')
const cheerio = require('cheerio')
var FormData = require('form-data')
const fs = require('fs')
const open = require('open')
const {
    app,
} = require('electron')
var HttpsProxyAgent = require('https-proxy-agent');
const { time } = require('console')

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
        this.sessions = {}
    };

    setIPAddress(ip) {
        this.IPAddress = ip
    };

    setUserAgent(UA) {
        this.UA = UA
    };

    async startSession(proxy) {
        //console.log('session Storage', this.sessions)
        var headers = {}
        var isErrored = false

        console.log('received proxy', proxy)

        if (!this.IPAddress) return 'ip address required'
        var wasmbinsrc = null

        //console.log(this.sessions)
        if (!proxy) proxy = 'localhost'
        if (this.sessions[proxy]) {
            this.cookie = this.sessions[proxy]['cookie']
            this.session = this.sessions[proxy]['session']
            return {
            session: this.sessions[proxy]['session']
        } 
    }
    this.proxy = proxy

        var test = undefined
        var expiration = new Date()
        expiration.setMinutes(expiration.getMinutes() - 5)

        for (var a in this.sessions) {
            //console.log(a, proxy)
            if (this.sessions[a]['time'] < expiration) {
                delete this.sessions[a]
                console.log('removing wasm file!')
            } else if (proxy === a) {
                this.cookie = this.sessions[a]['cookie']
                this.session = this.sessions[a]['session']
                console.log('proxy found in database')
                test = this.sessions[a]['session']
                break
            }
        }

        if (test) {
            console.log('return only session data')
            return {
                session: test
            }
        }

        wasmbinsrc = await source()
            .catch(e => {
                console.log(e)
                isErrored = true
            })

        if (isErrored) return

        if (this.cookie) headers['cookie'] = this.cookie
        //console.log('cookie used', params)
        //console.log('using proxy for _ticket checkout', this.proxy)
        var params = {
            headers: {
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "referrer": "https://www.supremenewyork.com/mobile",
                "Connection": "keep-alive"
            },
            timeout: 2500,
        }

        if (proxy !== 'localhost') params['agent'] = new HttpsProxyAgent(proxy)

        //console.log(params)
        console.log(this.sessions)
        return new Promise(async (resolve, reject) => {
            await fetch(wasmbinsrc, params)
                .then(async resp => {
                    var path = app.getPath('userData') + `/logs/${await rndString()}.wasm`

                    console.log('wasm endpoint status', resp.status)

                    //console.log(JSON.stringify(this.sessions, null, 2))
                    console.log('requested wasm')
                    var file = fs.createWriteStream(path)
                    file.on("error", (function (e) {
                        console.log(e)
                        return
                    }))
                    //console.log(resp.body)
                    await resp.body.pipe(file)

                    await sleep(250)


                    //fs.unlinkSync(db[a]['path'])
                    var upload = new FormData()
                    upload.append('wasm', fs.createReadStream(path));
                    upload.append('key', this.key);
                    //mainWindow.webContents.send('alert', "upload" + upload)
                    //console.log(upload)
                    await fetch(`http://${this.IPAddress}/upload`, {
                            method: 'POST',
                            body: upload,
                            //headers: headers,
                        })
                        .then(async resp => {

                            if (resp.status === 503) {
                                reject(await resp.text())
                                return
                            }

                            try {
                                const cookie = resp.headers.get("set-cookie").split(';')[0]
                                this.cookie = cookie
                            } catch (error) {

                            }

                            resp = await resp.json()
                            //mainWindow.webContents.send('alert', resp)
                            this.session = resp['session']


                            if (resp['error'].includes('session not found in db')) this.cookie = undefined
                            if (resp['success']) {
                                this.session = resp['session']
                                if (!proxy) proxy = 'localhost'
                                this.sessions[proxy] = {
                                    path: path,
                                    session: this.session,
                                    cookie: this.cookie,
                                    time: new Date().getTime()
                                }
                                if (Number(resp['size']) < 40) console.log('wasm size seems invalid')
                                resolve(resp)
                            } else reject(resp)
                        })
                        .catch(err => {
                            reject(err)
                        })

                    //fs.unlinkSync(path)
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

            var timestamp = new Date()
            timestamp.setMilliseconds(timestamp.getMilliseconds() + 80)

            console.log('generate ticket session', this.session)
            var body = {
                "userAgent": this.UA,
                "cookie": cookies,
                "key": this.key,
                "session": this.session,
                "timestamp": timestamp.getTime()
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
            //console.log(params)

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
                        this.sessions[this.proxy || 'localhost']['cookie'] = cookie
                    } catch (error) {

                    }
                    resp = await resp.json()
                    this.session = resp['session']
                    this.sessions[this.proxy || 'localhost']['session'] = this.session
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
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))