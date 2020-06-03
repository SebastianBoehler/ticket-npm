# BOEHLER IO TICKET API INTEGRATION

Usage:

```
const TicketAPI = require('boehlerio-ticketapi')
const myTicket = new TicketAPI('your-key-here')

myTicket.setIPAddress('127.0.0.10:3000');
myTicket.setProxy('http://127.0.0.10:3000@username:password')

(async () => {
    await ticketAPI.startSession()
    const ticket = await ticketAPI.generateTicket(UA, cookie, proxy)
    .catch(e => { 
        console.log(e) 
    })
    console.log(ticket['_ticket'])
})()
```