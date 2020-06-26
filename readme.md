# BOEHLER IO TICKET API INTEGRATION

Easily generate _ticket cookies by using our API

# Installation

`npm i boehlerio-ticketapi`

# Usage:

We've provided you with a key and the IP address of our US /EU servers if you're allowed to use our API

UserAgent (UA) , proxy and cookie/s need to be passed as string

Example proxy format: "http://username:password@ipAddress:port" // "http://ipAddress:port"

Make sure to adjust the file path of the wasm file.
__dirname could be used instaed of app.getPath for example, depending on your project.
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

A successful example response from startSession would look like:
```
{
  success: true,
  error: [],
  session: 'JKS5K-SUJKT-1W93W-0I7B8',
  'received size': 46748,
  timestamp: 1591797668729
}
```
IMPORTANT: Session response CAN be undefined! So startSession(proxy) would return undefined if getting the latest wasm source fails.
Make sure to handle this case to prevent malfunctions.

A successful example response from generateTicket would look like:
```
{
  success: true,
  error: [],
  'key expiration date': null,
  session: 'JKS5K-SUJKT-1W93W-0I7B8',
  _ticket: '_ticket=637836a8844de1cf8587072ad69a75f5116caf39642ef5c6b78512506c516ab1266897df75bdcdcec92b6e74e97a50db7b489e3be221fc1493a9981dcb42b6141591797669',  
  userAgent: 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
  timing: '0.205 ms'
}
```
