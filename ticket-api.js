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
    }

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
            await fetch(`http://${this.IPAddress}/ticket`, {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 4500
                    }).then(async resp => {
                        if (resp.status === 503) {
                            reject('invalid request payload! status 503 returned')
                            return
                        }
                        resp = await resp.json()
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