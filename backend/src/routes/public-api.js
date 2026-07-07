import express from "express";
import userController from "../controller/user-controller.js";
import healthController from "../controller/health-controller.js";
import categoryController from "../controller/category-controller.js";
import itemController from "../controller/item-controller.js";
import commentController from "../controller/comment-controller.js";
import { refreshLimiter } from "../middleware/rateLimit-middleware.js";

const publicRouter = new express.Router();

publicRouter.post('/api/auth/register', userController.register);
publicRouter.post('/api/auth/login', userController.login);
publicRouter.post('/api/auth/refresh', refreshLimiter, userController.refreshToken);
publicRouter.get('/ping', healthController.ping);
publicRouter.get("/api/categories", categoryController.list);

// Rute Publik untuk Barang
publicRouter.get('/api/public/items', itemController.getAll);
publicRouter.get('/api/public/items/:itemId', itemController.get);
publicRouter.get('/api/public/items/:itemId/comments', commentController.list);

export {
    publicRouter
}