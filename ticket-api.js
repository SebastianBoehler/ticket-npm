const fetch = require('node-fetch')

module.exports = class TicketAPI {
    constructor (key) {
        this.key = key
    };

    setIPAddress(ip) {
        this.IPAddress = ip
    };

    setProxy(proxy) {
        this.proxy = proxy
    };

    setUserAgent(UA) {
        this.UA = UA
    };

    async startSession() {
        if (!this.IPAddress) return 'Setup IPAddress first!'
        return new Promise(async (resolve, reject) => {
            await fetch(`http://${this.IPAddress}/session`, {
                        method: 'POST',
                        body: JSON.stringify({
                            "userAgent": this.UA,
                            "key": this.key,
                            "proxy": this.proxy
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 4500
                    }).then(async resp => {
                        if (resp.status === 503) {
                            reject('invalid request payload! status 503 returned')
                            return
                        }
                        this.cookie = resp.headers.get("set-cookie")
                        resp = await resp.json()
                        this.session = resp['session']
                        resolve(resp['session'])
                        
                        //console.log(resp['_ticket'])
                        //_ticket = resp['_ticket']
                        //return _ticket
                    })
                    .catch(e => {
                        console.log(e)
                        reject('failed', e)
                    })
        })
    }

    async generateTicket(UA, cookies) {
        if (!this.IPAddress) return 'Setup IPAddress first!'
        return new Promise(async (resolve, reject) => {
            console.log(this.key)

            if (!this.proxy && !this.session) {
                reject('Proxy or session required!')
                return
            }

            var body = {
                "userAgent": this.UA,
                "cookie": cookies,
                "key": this.key,
                "proxy": this.proxy
            }

            if (this.session) {
                body['session'] = this.session
                console.log('using session:', body['session'])
            }

            var timeout = 750
            if (!this.session) timeout = 2000
            console.log(this.cookie.split(';')[0])
            await fetch(`http://${this.IPAddress}/ticket`, {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: timeout,
                        cookie: this.cookie.split(';')[0]
                    }).then(async resp => {
                        console.log(this.cookie.split(';')[0])
                        if (resp.status === 503) {
                            reject('invalid request payload! status 503 returned')
                            return
                        }
                        resp = await resp.json()
                        //this.session = resp['session']
                        resolve(resp)
                        //console.log(resp['_ticket'])
                        //_ticket = resp['_ticket']
                        //return _ticket
                    })
                    .catch(e => {
                        console.log(e)
                        reject('failed', e)
                    })
        })
    };
}