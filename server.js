import express from 'express';
import cors from 'cors';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env for the Base URL
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = process.env.API_BASE_URL;

const app = express();
const port = 8000;

const engine = new Liquid({
    root: path.resolve(__dirname, 'views'), 
    extname: '.liquid'
});

// Helper for images - No token needed if 'Public' role has read access to files
engine.registerFilter('asset_url', (id) => {
    if (!id) return '';
    return `${API_BASE_URL}/assets/${id}`;
});

app.engine('liquid', engine.express());
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'liquid');

app.use(cors());
app.use(express.static('public'));

app.get('/', async (req, res) => {
    try {
        // Simple fetch without Authorization headers
        const response = await fetch(`${API_BASE_URL}/items/portfolio_items`);
        
        if (!response.ok) {
            // If this still says 401, you haven't set 'Public' permissions in Directus
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();

        res.render('index', { 
            projects: result.data 
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server Error: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`🚀 Server spinning at http://localhost:${port}`);
});