import express from 'express';
import cors from 'cors';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = (process.env.API_BASE_URL || 'https://api.gijsnagtegaal.nl').replace(/\/$/, '');
const app = express();
const port = process.env.PORT || 8000;

// --- CONFIG ---
const engine = new Liquid({
    root: path.resolve(__dirname, 'views'),
    extname: '.liquid',
    cache: process.env.NODE_ENV === 'production'
});
app.engine('liquid', engine.express());
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'liquid');

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); // Support for POST requests

// --- HELPERS ---

/**
 * The "Magic" Image Fixer
 * Automatically finds image keys and appends the Base URL.
 * Add any keys your API uses for images to the 'imageKeys' set.
 */
const processData = (data) => {
    if (!data) return data;
    const imageKeys = new Set(['image', 'icon', 'thumbnail', 'avatar', 'cover']);

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => processData(item));
    }

    // Handle Objects
    if (typeof data === 'object') {
        const processed = { ...data };
        for (const key in processed) {
            if (imageKeys.has(key) && processed[key] && typeof processed[key] === 'string') {
                // Only transform if it's just a UUID and not already a URL
                if (!processed[key].startsWith('http')) {
                    processed[key] = `${API_BASE_URL}/assets/${processed[key]}`;
                }
            } else if (typeof processed[key] === 'object') {
                processed[key] = processData(processed[key]); // Recursive for nested data
            }
        }
        return processed;
    }
    return data;
};

const fetchData = async (endpoint) => {
    const res = await fetch(`${API_BASE_URL}/items/${endpoint}`);
    if (!res.ok) throw new Error(`API error on ${endpoint}: ${res.status}`);
    const json = await res.json();
    return processData(json.data); // Automatically fix all images here!
};

// --- ROUTES ---

// Main Home Route
app.get('/', async (req, res) => {
    try {
        const [projects, techStack] = await Promise.all([
            fetchData('portfolio_items'),
            fetchData('tech_stack')
        ]);

        res.render('index', { projects, techStack });
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Example of how easy it is to add more routes now:
app.get('/blog', async (req, res) => {
    const posts = await fetchData('blog_posts'); // All 'image' or 'cover' fields fixed automatically
    res.render('blog', { posts });
});

// Example POST route
app.post('/contact', async (req, res) => {
    // Forward data to Directus or Email service
    console.log("Form received:", req.body);
    res.json({ success: true });
});

app.listen(port, () => console.log(`🚀 Site running at http://localhost:${port}`));