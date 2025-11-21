const axios = require('axios');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const cron = require('node-cron');

// Configuration
const BASE_URL = "http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/";
const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_BASE_DIR = path.join(__dirname, 'output');

// Ensure directories exist
if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_BASE_DIR)) fs.mkdirSync(OUTPUT_BASE_DIR, { recursive: true });

/**
 * Get current date in CDMX (UTC-6)
 */
function getCDMXDate() {
    const now = new Date();
    // UTC time in ms
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // CDMX is UTC-6 (fixed as per requirement)
    const cdmxTime = new Date(utc + (3600000 * -6));
    return cdmxTime;
}

/**
 * Format date as YYYYMMDD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Clean column name: lowercase, remove accents, replace spaces with underscores
 */
function cleanColumnName(colName) {
    if (!colName) return '';
    return colName.toString().trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, "_");
}

/**
 * Download the most recent catalog file
 */
async function downloadCatalogFile() {
    const cdmxNow = getCDMXDate();
    // Start searching from yesterday as per original logic
    let searchDate = new Date(cdmxNow);
    searchDate.setDate(searchDate.getDate() - 1);

    console.log(`Searching for catalogs starting from: ${formatDate(searchDate)}`);

    for (let i = 0; i < 31; i++) {
        const currentSearchDate = new Date(searchDate);
        currentSearchDate.setDate(searchDate.getDate() - i);
        const dateStr = formatDate(currentSearchDate);
        const filename = `catCFDI_V_4_${dateStr}.xls`;
        const filePath = path.join(INPUT_DIR, filename);
        const url = BASE_URL + filename;

        if (fs.existsSync(filePath)) {
            console.log(`File already exists locally: ${filePath}`);
            return filePath;
        }

        console.log(`Attempting to download: ${url}`);

        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            fs.writeFileSync(filePath, response.data);
            console.log(`File downloaded successfully: ${filePath}`);
            return filePath;
        } catch (error) {
            // Continue to next date if not found or error
            continue;
        }
    }

    throw new Error("Could not download SAT catalog file after checking 30 days.");
}

/**
 * Process the Excel file and convert to JSON
 */
async function processCatalogs(filePath) {
    const basename = path.basename(filePath);
    const dateStr = basename.replace("catCFDI_V_4_", "").replace(".xls", "");
    const outputDir = path.join(OUTPUT_BASE_DIR, dateStr);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Output directory created: ${outputDir}`);
    }

    const workbook = xlsx.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        
        const jsonPath = path.join(outputDir, `${sheetName}.json`);
        if (fs.existsSync(jsonPath)) {
            continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        // Convert sheet to array of arrays to find the header row
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

        if (!data || data.length === 0) {
            console.log(`Empty sheet: ${sheetName}`);
            continue;
        }

        // Find start row
        let startRowIndex = -1;
        let sheetReplaced = sheetName.replace("_Parte_1", "").replace("_Parte_2", "").toLowerCase();

        for (let i = 0; i < data.length; i++) {
            const firstCell = data[i][0];
            if (firstCell && firstCell.toString().toLowerCase() === sheetReplaced) {
                startRowIndex = i + 1; // Header is usually the next row
                break;
            }
        }

        if (startRowIndex === -1 || startRowIndex >= data.length) {
            console.log(`Table start not found for sheet: ${sheetName}, skipping.`);
            continue;
        }

        // Handle Parte_1 and Parte_2 logic (merged headers)
        let headers = [];
        let dataStartIndex = startRowIndex + 1;

        if (sheetName.includes("Parte_1") || sheetName.includes("Parte_2")) {
             // Read headers from the found row, but only first 7 columns (A:G)
             // Note: In the python script, it read headers from `startRow`, then incremented startRow by 1.
             // It seems it captured headers from one row, but the data started 2 rows after the 'title' row?
             // Python: header=start_row (which is index+1). 
             // Let's assume the row at startRowIndex is the header row.
             
             const headerRow = data[startRowIndex];
             // Take first 7 columns for headers if it's Parte_1/2
             headers = headerRow.slice(0, 7).map(h => cleanColumnName(h));
             
             // The Python script re-reads the file skipping 5 rows for the main data? 
             // Wait, the python script logic for Parte_1/2 is specific:
             // 1. Read header from `start_row` (usecols A:G) -> gets headers
             // 2. `start_row += 1`
             // 3. Read main df from `start_row` (ignoring first 5 rows? No, the comment says "ignorar las primeras 5 filas" but the code uses `header=start_row`)
             // Let's stick to the logic: The header is at `startRowIndex`.
             
             // However, line 120 in python says: "leer primer hoja desde el renglon 6 (ignorar las primeras 5 filas)" 
             // BUT it uses `header=start_row`. `start_row` was calculated dynamically.
             // Let's rely on the dynamic calculation.
             
             // For Parte_1/2, we use the headers we found, but apply them to the first 7 columns of the data.
        } else {
            headers = data[startRowIndex].map(h => cleanColumnName(h));
        }

        // Extract data
        // We use the headers to map the data
        const rawData = data.slice(dataStartIndex);
        const jsonData = rawData.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                // For Parte_1/2, we might have more columns in row than headers, or vice versa.
                // Python script: `cols[:7] = encabezados` -> overwrites first 7 col names.
                // We'll just map the first N columns to the N headers we have.
                let value = row[index];
                // Convert undefined/null to null (or keep as is, JSON stringify handles it)
                if (value === undefined) value = null;
                obj[header] = value;
            });
            return obj;
        });
        
        // Filter out empty objects if any
        const finalData = jsonData.filter(item => Object.keys(item).length > 0);

        fs.writeFileSync(jsonPath, JSON.stringify(finalData, null, 4));
    }
}

/**
 * Main execution function
 */
async function runConversion() {
    try {
        console.log("Starting catalog conversion process...");
        const filePath = await downloadCatalogFile();
        await processCatalogs(filePath);
        console.log("Catalog conversion completed successfully.");
    } catch (error) {
        console.error("Error during conversion process:", error);
    }
}

/**
 * Initialize Scheduler
 */
function startScheduler() {
    // Run at 16:00 CDMX time every day
    // Cron pattern: "0 0 * * *" (At 00:00)
    // We need to handle timezone. node-cron supports timezone.
    
    cron.schedule('4 16 * * *', () => {
        console.log("Running scheduled task: SAT Catalog Conversion");
        runConversion();
    }, {
        scheduled: true,
        timezone: "America/Mexico_City"
    });
    
    console.log("Scheduler started: SAT Catalog Conversion will run daily at 00:00 CDMX.");
}

// Export functions
module.exports = {
    runConversion,
    startScheduler
};

// If run directly
if (require.main === module) {
    runConversion();
}
