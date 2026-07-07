import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import { globalLimiter } from '../middleware/rateLimit-middleware.js';
import { errorMiddleware } from '../middleware/error-middleware.js';
import { fileURLToPath  } from 'url';
import { publicRouter } from '../routes/public-api.js';
import { userRouter } from '../routes/api.js';
import { swaggerSpec } from '../docs/swagger.js';

export const web = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

web.use(express.json());
web.use(cookieParser());
web.use(express.urlencoded({ extended: true }));
web.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
web.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
web.use(globalLimiter);

web.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'LostFound Campus API Docs',
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true
    }
}));

web.use(userRouter);
web.use(publicRouter);
web.use(errorMiddleware);