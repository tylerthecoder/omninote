import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './router.ts';
import cors from 'cors';
import { mongoDBService } from './mongodb-service.ts';

const port = 2022;

const startServer = async () => {
    await mongoDBService.connect();
    createHTTPServer({
        middleware: cors(),
        router: appRouter,
        createContext() {
            return {};
        },
    }).listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

startServer();