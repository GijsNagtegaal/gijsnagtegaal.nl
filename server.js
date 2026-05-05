import express from 'express';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Import separated db file
import supabase from './db.js'; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// View Engine Setup
const engine = new Liquid({ root: path.resolve(__dirname, 'views'), extname: '.liquid' });
app.engine('liquid', engine.express());
app.set('view engine', 'liquid');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---

// Fetch from Database
app.get('/', async (req, res) => {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) console.error("Fetch error:", error);
    res.render('index', { projects });
});

app.listen(8000, () => console.log('Server running on http://localhost:8000'));