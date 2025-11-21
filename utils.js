const fs = require('fs');
const path = require('path');

/**
 * Helper function to get the latest catalog file from the output directory.
 * @param {string} filename - The name of the file to retrieve (e.g., 'c_FormaPago.json').
 * @returns {Object} - The parsed JSON content of the file.
 * @throws {Error} - If no data directories are found or the file does not exist.
 */
function getLatestCatalogo(filename) {
    const outputDir = path.join(__dirname, 'output');
    
    // Get all items in the output directory
    const items = fs.readdirSync(outputDir);

    // Filter for directories and sort them (descending order to get the latest date)
    const directories = items.filter(item => {
        return fs.statSync(path.join(outputDir, item)).isDirectory();
    }).sort().reverse();

    if (directories.length === 0) {
        throw new Error('No data directories found');
    }

    const latestDir = directories[0];
    const filePath = path.join(outputDir, latestDir, filename);

    if (!fs.existsSync(filePath)) {
         throw new Error(`File ${filename} not found in latest data (${latestDir})`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
}

module.exports = {
    getLatestCatalogo
};
