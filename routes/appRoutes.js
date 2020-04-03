const express = require('express');
const bodyParser = require('body-parser');
const appRouter = express.Router();
const { Client } = require('pg');
const connectionString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_URL}/${process.env.PG_DATABASE}`;

const client = new Client({
    connectionString
});

client.connect();

appRouter.route('/')
    .all((req, res, next) =>{
        res.statusCode = 200;
        res.setHeader('Content-type','text/plain');
        next();
    })
    .get(async (req, res, next) =>{
        const query = await client.query("SELECT * FROM shop")
        res.end(JSON.stringify(query.rows))
    })
    .post(async (req, res, next) => {
        console.log(client)
        const query =  await client.query(`INSERT INTO shop (id,name,created_at,updated_at)
                                                  SELECT ${req.body.id} AS id, 
                                                  ${req.body.name} AS name,  
                                                  ${req.body.createdAt} as created_at, 
                                                  ${req.body.updatedAt} as updated_at 
                                                  FROM shop
                                                  WHERE NOT EXISTS(
                                                      SELECT id FROM shop WHERE id = ${req.body.id})
                                                  LIMIT 1;`);
        console.log(req.body.id);
        res.end(`Agregar el shop ${req.body.id}`)
    })
    .put((req, res, next) => {
        res.statusCode = 403;
        res.end('PUT OPERATION NOT SUPPORTED ON /SHOPS');
    })
    .delete((req, res, next) =>{
        res.end(`borrando todos LOS NO INSERTADOS`);
    })
// /shops/123
appRouter.route('/:shopId')
    .all((req, res, next) =>{
        res.statusCode = 200;
        res.setHeader('Content-type','text/plain');
        next()
    })
    .get(async (req, res, next) =>{
        const query = await client.query(`SELECT * FROM shop where id=${req.params.shopId}`);
        res.end(JSON.stringify(query.rows));
    })
    .delete((req, res, next) =>{
        res.end(`Borrando el shop `);
    })
module.exports  = appRouter

