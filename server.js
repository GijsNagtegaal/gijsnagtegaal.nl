import express from 'express';
import { Liquid } from 'liquidjs';
import { fileURLToPath } from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const API_BASE = 'https://api.gijsnagtegaal.nl/items';
const ASSET_BASE = 'https://api.gijsnagtegaal.nl/assets';
const PLACEHOLDER_IMAGE = '/assets/images/alium.webp';

// ─── APP SETUP ──────────────────────────────────────────────────────────────────

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/gsap', express.static(path.join(__dirname, 'node_modules/gsap/dist/')));

const engine = new Liquid();
app.engine('liquid', engine.express());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'liquid');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Converts an asset ID or object into a full URL string.
 */
const assetUrl = (asset) => {
    if (!asset) return PLACEHOLDER_IMAGE;
    const id = typeof asset === 'object' ? (asset.id || asset.memoji) : asset;
    return (id && typeof id === 'string')
        ? `${ASSET_BASE}/${id}`
        : PLACEHOLDER_IMAGE;
};

/**
 * Standard fetch wrapper for the Directus API.
 */
const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`);
        const result = await response.json();
        return result.data;
    } catch (e) {
        console.error(`Fetch error for ${endpoint}:`, e);
        return null;
    }
};

/**
 * Maps through raw API data and ensures the 'image' field is a valid URL.
 */
const processItems = (items) => {
    if (!items) return [];
    const array = Array.isArray(items) ? items : [items];

    return array.map(item => ({
        ...item,
        // Process both image fields through assetUrl
        image: assetUrl(item.image),
        image_dark: assetUrl(item.image_dark)
    }));
};

// ─── GLOBAL MIDDLEWARE ────────────────────────────────────────────────────────

app.use((request, response, next) => {
    response.locals.currentPath = request.path;
    next();
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/', async (request, response) => {
    try {
        const [rawProjects, rawTech] = await Promise.all([
            fetchData('portfolio_items'),
            fetchData('tech_stack'),
        ]);

        response.render('index.liquid', {
            projects: processItems(rawProjects),
            techStack: processItems(rawTech)
        });
    } catch (error) {
        console.error('Home route error:', error);
        response.status(500).send('Server error');
    }
});

app.get('/portfolio', async (request, response) => {
    try {
        const rawItems = await fetchData('portfolio_items');
        response.render('portfolio.liquid', {
            portfolioItems: processItems(rawItems)
        });
    } catch (error) {
        console.error('Portfolio route error:', error);
        response.status(500).send('Server error');
    }
});

app.get('/portfolio/project/:slug', async (request, response) => {
    try {
        const slug = request.params.slug;
        const rawItem = await fetchData(`portfolio_items?filter[slug][_eq]=${slug}`);
        
        if (!rawItem || rawItem.length === 0) {
            return response.status(404).send('Project niet gevonden');
        }

        // Processing the single item (wrapped in an array by fetchData)
        const project = processItems(rawItem)[0];

        response.render('project-detail.liquid', {
            project: project 
        });
    } catch (error) {
        console.error('Project route error:', error);
        response.status(500).send('Interne server fout');
    }
});

// ─── SERVER START ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server started: http://localhost:${PORT}`);
});