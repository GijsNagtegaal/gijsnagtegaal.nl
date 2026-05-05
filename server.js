import express from 'express';
import cors from 'cors';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. Path Setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Load Environment Variables
// This version ensures the .env is found even on a VPS
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.gijsnagtegaal.nl';
const app = express();
const port = process.env.PORT || 8000;

// 3. Liquid Engine Setup
const engine = new Liquid({
    root: path.resolve(__dirname, 'views'), 
    extname: '.liquid'
});

// 4. Helper for Images
// Uses the Public permission you just set for directus_files
engine.registerFilter('asset_url', (id) => {
    if (!id) return '';
    return `${API_BASE_URL}/assets/${id}`;
});

app.engine('liquid', engine.express());
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'liquid');

// 5. Global Middleware
app.use(cors());
app.use(express.static('public'));

// 6. The Primary Route
app.get('/', async (req, res) => {
    try {
        const apiUrl = `${API_BASE_URL}/items/portfolio_items`;
        
        // No Authorization header needed now that it's Public!
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const result = await response.json();

        res.render('index', { 
            projects: result.data 
        });
    } catch (error) {
        console.error('Fetch Error:', error.message);
        res.status(500).send(`Server Error: ${error.message}`);
    }
});

// 7. Start Server
app.listen(port, () => {
    console.log(`------------------------------------------`);
    console.log(`🚀 Server: http://localhost:${port}`);
    console.log(`🔗 API:    ${API_BASE_URL}`);
    console.log(`------------------------------------------`);
});