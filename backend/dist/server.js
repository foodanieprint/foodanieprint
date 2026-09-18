import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateMiddleware } from './auth.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { optionsRouter } from './routes/options.js';
import { designsRouter } from './routes/designs.js';
import { ordersRouter } from './routes/orders.js';
import { settingsRouter } from './routes/settings.js';
import { templatesRouter } from './routes/templates.js';
import { dbStatusRouter } from './routes/dbStatus.js';
import { uploadRouter } from './routes/upload.js';
import path from 'path';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Set up CORS configurations
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin ||
            allowedOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.includes('railway.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Serve uploaded files statically
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
// Global authentication middleware
app.use(authenticateMiddleware);
// Routes registration
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/options', optionsRouter);
app.use('/api/designs', designsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/db-status', dbStatusRouter);
app.use('/api/upload', uploadRouter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'printear-backend' });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Decoupled backend listening on port ${PORT}`);
});
