const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
const { getLatestCatalogo } = require('./utils');

// Enable CORS for all routes
app.use(cors())

app.get('/', (req, res) => {
  res.json({ 
    name: 'sat-catalogos-api',
    message: 'Hola, parece que el api se esta ejecutando correctamente.' })
})


app.get('/formas_pago', (req, res) => {
    try {
        const data = getLatestCatalogo('c_FormaPago.json');
        res.json(data);
    } catch (error) {
        console.error('Error serving formas_pago:', error.message);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`)
  
  // Start the daily conversion scheduler
  const { startScheduler } = require('./conversion');
  startScheduler();
})
