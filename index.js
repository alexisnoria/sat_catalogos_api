const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
const fs = require('fs');
const path = require('path');
const { getLatestCatalogo } = require('./utils');
const { startScheduler, runConversion } = require('./conversion');

// Enable CORS for all routes
app.use(cors())

app.get('/', (req, res) => {
    res.json({
        name: 'sat-catalogos-api',
        message: 'Hola, parece que el api se esta ejecutando correctamente.'
    })
})


app.get('/:catalog', (req, res) => {
    try {
        let { catalog } = req.params;

        // Basic sanitization to prevent directory traversal
        if (catalog.includes('..') || catalog.includes('/') || catalog.includes('\\')) {
            return res.status(400).json({ error: 'Invalid catalog name' });
        }

        // Append .json if not present
        if (!catalog.endsWith('.json')) {
            catalog += '.json';
        }

        const { version, data } = getLatestCatalogo(catalog);
        res.json({
            version,
            data
        });
    } catch (error) {
        console.error(`Error serving catalog ${req.params.catalog}:`, error.message);
        if (error.message.includes('not found')) {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})

app.listen(port, async () => {
    console.log(`Sat Catalogos API listening on port http://localhost:${port}`)

    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir) || fs.readdirSync(outputDir).length === 0) {
        console.log("Output directory missing or empty. Running initial conversion...");
        await runConversion();
    }

    startScheduler();
})
