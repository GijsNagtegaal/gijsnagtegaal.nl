import express from 'express';
import { Liquid } from 'liquidjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const engine = new Liquid({
    root: path.resolve(__dirname, 'public/views'), 
    extname: '.liquid'
});

app.engine('liquid', engine.express());
app.set('views', path.join(__dirname, '/views')); 
app.set('view engine', 'liquid');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', async (req, res) => {
    res.render('index'); 
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});