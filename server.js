import 'dotenv/config'; // 1. Load variables first
import express from 'express';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// 2. Now import the db file that uses those variables
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

app.get('/', async (req, res) => {
    try {
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Change 'index' to 'test' to match test.liquid
        res.render('test', { projects }); 
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).send("Database Error");
    }
});

app.get('/test-db', async (req, res) => {
    try {
        // Use { count: 'exact' } to get the total number of rows
        const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        res.send(`Database connected! The "projects" table contains ${count} total rows.`);
    } catch (err) {
        res.status(500).send(`Connection failed: ${err.message}`);
    }
});

app.listen(8000, () => console.log('Server running on http://localhost:8000'));