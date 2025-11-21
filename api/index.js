const express = require('express')
const app = express()
const port = 3000



app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' })
})

app.get('/formas_pago', (req, res) => {
    //cargar el archivo json catalogo_formas_pagos.json
    const formasPago = require('./catalogos/catalogo_formas_pagos.json');
    res.json(formasPago);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
