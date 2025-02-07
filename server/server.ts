import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { appRouter } from './router.ts';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createContext } from './context.ts';
import { DatabaseSingleton } from 'tt-services/src/connections/mongo.ts';

dotenv.config();

const SERVER_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const startServer = async () => {
    const app = express();

    app.use(cors());

    console.log("Connecting to db");
    const startTime = Date.now();
    const db = await DatabaseSingleton.getInstance();


    // Request logger middleware
    app.use((req, res, next) => {
        const start = Date.now();
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`);

        // Add listener for when response finishes
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Completed in ${duration}ms`);
        });

        next();
    });

    // Set up the tRPC middleware
    app.use('/trpc', createExpressMiddleware({
        router: appRouter,
        createContext,

    }));

    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../dist')));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    app.listen(SERVER_PORT, () => {
        console.log(`Server is running on http://localhost:${SERVER_PORT}`);
    });
}

startServer();