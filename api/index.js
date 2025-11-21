const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

// Enable CORS for all routes
app.use(cors())

app.get('/', (req, res) => {
  res.json({ 
    name: 'sat-catalogos-api',
    message: 'Hola, parece que el api se esta ejecutando correctamente.' })
})

app.get('/formas_pago', (req, res) => {
    //cargar el archivo json catalogo_formas_pagos.json
    const formasPago = require('./catalogos/catalogo_formas_pagos.json');
    res.json(formasPago);
})

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
})
