const express = require('express')
const bodyParser = require('body-parser')
const appRouter = express.Router()
const { Client } = require('pg')
const connectionString = 'postgresql://pguser:satyr123@127.0.0.1/capacitacion'

const client = new Client({
    connectionString
})

client.connect()
// /dishes

appRouter.route('/')
    .all((req, res, next) =>{
        res.statusCode = 200
        res.setHeader('Content-type','text/plain')
        next()
    })
    .get(async (req, res, next) =>{
        const query = await client.query("SELECT * FROM dishes")
        res.end(JSON.stringify(query.rows))
    })
    .post(async (req, res, next) => {
        const query =  await client.query(`INSERT INTO dishes(name) VALUES('${req.body.name}');`)
        res.end(`Agregar el dish ${req.body.name}`)
    })
    .put((req, res, next) => {
        res.statusCode = 403
        res.end('PUT OPERATION NOT SUPPORTED ON /DISHES')
    })
    .delete((req, res, next) =>{
        res.end(`borrando todos los dishes`)
    })
// /dishes/123
appRouter.route('/:dishId')
    .all((req, res, next) =>{
        res.statusCode = 200
        res.setHeader('Content-type','text/plain')
        next()
    })
    .get(async (req, res, next) =>{
        const query = await client.query(`SELECT * FROM dishes where id=${req.params.dishId}`)
        res.end(JSON.stringify(query.rows))
    })
    .put((req,res, next)=>{
        res.end(`modificar el dish ${req.params.dishId}: ${req.body.name} - ${req.body.description}`)
    })
    .delete((req, res, next) =>{
        res.end(`Borrando todos los dishes`)
    })
module.exports  = appRouter

