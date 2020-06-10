# BOEHLER IO TICKET API INTEGRATION

Easily generate _ticket cookies by using our API

# Installation

`npm i boehlerio-ticketapi`

# Usage:

We've provided you with a key and the IP address of our US /EU servers if you're allowed to use our API

UserAgent (UA) , proxy and cookie/s need to be passed as string

Example proxy format: "http://username:password@ipAddress:port" // "http://ipAddress:port"
```
const TicketAPI = require('boehlerio-ticketapi')
const myTicket = new TicketAPI('your-key-here')

myTicket.setIPAddress(ipAddress)
myTicket.setUserAgent(proxy);

(async () => {
    try {
        const session = await myTicket.startSession(proxy)
        .catch(e => {
            console.log('error', e)
        })


        const ticket = await myTicket.generateTicket(cookie)
        .catch(e => {
            console.log('error', e)
        }) 

        console.log(ticket)
    } catch (error) {
        console.log(error)
    }
})()
```

