const express = require('express')
const http = require('http')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const appRouter = require('./routes/appRoutes')
const hostname = 'localhost'

const port = 550
const app  = express()
//interpreta todo lo que venga en el body como un json
app.use(bodyParser.json())
//esto lo uqe hace es llamar cada callbacks y los va ejecutando uno a uno y los lanza al server como un middleware
app.use(morgan('dev'))
app.use(express.static(__dirname + '/public'))
app.use('/dishes' , appRouter)

const server  = http.createServer(app)
server.listen(port,hostname, ()=>{
    console.log(`server running at http://${hostname}:${port}`)
})
