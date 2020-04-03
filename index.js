const express = require('express')
const cron = require("node-cron");
const http = require('http')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const appRouter = require('./routes/appRoutes')
const scraper = require('./controllers/scraper')
require('dotenv').config()

const app  = express()
//interpreta todo lo que venga en el body como un json
app.use(bodyParser.json())
//esto lo que hace es llamar cada callbacks y los va ejecutando uno a uno y los lanza al server como un middleware
app.use(morgan('dev'))
app.use(express.static(__dirname + '/public'))
app.use('/shops' , appRouter)

cron.schedule("* * * * *", function() {
    scraper.shopList();
    console.log("running a scraper every minute");
});


const server  = http.createServer(app)
server.listen(process.env.PORT,process.env.HOST, ()=>{
    console.log(`server running at http://${process.env.HOST}:${process.env.PORT}`)
})
