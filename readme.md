# BOEHLER IO TICKET API INTEGRATION

Easily generate _ticket cookies by using our API

# Installation

`npm i boehlerio-ticketapi`

# Usage:

We've provided you with a key and the IP address of our US and EU servers if you're allowed to use our API

UserAgent (UA) and cookie/s need to be passed as string
```
const TicketAPI = require('boehlerio-ticketapi')
const myTicket = new TicketAPI('your-key-here')

myTicket.setIPAddress('127.0.0.10:3000');
myTicket.setProxy('http://127.0.0.10:3000@username:password')

(async () => {
    await myTicket.startSession()
    .catch(e => { 
        console.log(e) 
    })

    myTicket.setServerSession(myTicket.serverSession())

    const ticket = await myTicket.generateTicket(cookie)
    .catch(e => { 
        console.log(e) 
    })

    console.log(ticket)
})()
```

