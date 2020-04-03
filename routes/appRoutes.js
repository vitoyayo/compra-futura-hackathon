const express = require('express')
const bodyParser = require('body-parser')
const appRouter = express.Router()
const { Client } = require('pg')
const connectionString = 'postgresql://pguser:satyr123@127.0.0.1/compra-futura'

const client = new Client({
    connectionString
})

client.connect()

appRouter.route('/')
    .all((req, res, next) =>{
        res.statusCode = 200
        res.setHeader('Content-type','text/plain')
        next()
    })
    .get(async (req, res, next) =>{
        const query = await client.query("SELECT * FROM shop")
        res.end(JSON.stringify(query.rows))
    })
    .post(async (req, res, next) => {
        const query =  await client.query(`INSERT INTO shop(id,name,created_at,updated_at) VALUES('${req.body.id}','${req.body.name}','${req.body.createdAt}','${req.body.updatedAt}');`)
        res.end(`Agregar el shop ${req.body.name}`)
    })
    .put((req, res, next) => {
        res.statusCode = 403
        res.end('PUT OPERATION NOT SUPPORTED ON /SHOPS')
    })
    .delete((req, res, next) =>{
        res.end(`borrando todos LOS NO INSERTADOS`)
    })
// /shops/123
appRouter.route('/:shopId')
    .all((req, res, next) =>{
        res.statusCode = 200
        res.setHeader('Content-type','text/plain')
        next()
    })
    .get(async (req, res, next) =>{
        const query = await client.query(`SELECT * FROM shop where id=${req.params.shopId}`)
        res.end(JSON.stringify(query.rows))
    })
    .put((req,res, next)=>{
        res.end(`modificar el dish ${req.params.shopId}: ${req.body.name} - ${req.body.id}`)
    })
    .delete((req, res, next) =>{
        res.end(`Borrando todos los shops`)
    })
module.exports  = appRouter

