const fetch = require('node-fetch')

module.exports = class TicketAPI {
    constructor(key) {
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

    serverSession() {
        return this.cookie
    }

    setServerSession(session) {
        this.cookie = session
    }

    async startSession() {
        if (!this.IPAddress) return 'ip address required'
        else if (!this.proxy) return 'proxy required'
        if (this.session) {
            //console.log('session already set')
            return
        }
        var params = {
            method: 'POST',
            body: JSON.stringify({
                "userAgent": this.UA,
                "key": this.key,
                "proxy": this.proxy
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            timeout: 4500
        }
        if (this.cookie) params['headers']['cookie'] = this.cookie
        //console.log('cookie used', params)
        //console.log('using proxy for _ticket checkout', this.proxy)
        return new Promise(async (resolve, reject) => {
            await fetch(`http://${this.IPAddress}/session`, params).then(async resp => {
                    if (resp.status === 503) {
                        console.log(await resp.text())
                        reject('invalid request payload! status 503 returned')
                        return
                    }
                    try {
                        const cookie = resp.headers.get("set-cookie").split(';')[0]
                        this.cookie = cookie
                    } catch (error) {
                        
                    }
                    resp = await resp.json()
                    this.session = resp['session']
                    console.log('setting session after /session to', this.session)
                    resolve(resp['session'])

                    //console.log(resp['_ticket'])
                    //_ticket = resp['_ticket']
                    //return _ticket
                })
                .catch(e => {
                    //console.log(e)
                    reject('failed', e)
                })
        })
    }

    async generateTicket(cookies) {
        if (!this.IPAddress) return 'Setup IPAddress first!'
        return new Promise(async (resolve, reject) => {
            const startTime = new Date()
            //console.log(this.key)

            if (!this.proxy) {
                //console.log(this.proxy, this.session)
                reject('proxy required!')
                return
            }

            var body = {
                "userAgent": this.UA,
                "cookie": cookies,
                "key": this.key,
                "proxy": this.proxy
            }

            if (this.session) {
                //body['session'] = this.session
                //console.log('using session:' + body['session'] + ' for ticket gen')
            }

            //console.log(this.cookie.split(';')[0])
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
                        console.log(await resp.text())
                        reject('error occured! status 503 returned')
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
                    resp['timing'] = (endTime.getTime() - startTime.getTime()) / 1000
                    console.log('Response time', resp['timing'])
                    resolve(resp)
                    //console.log(resp['_ticket'])
                    //_ticket = resp['_ticket']
                    //return _ticket
                })
                .catch(e => {
                    console.log(e)
                    reject('failed', e || 'test')
                })
        })
    };
}