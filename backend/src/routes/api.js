import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth-middleware.js";
import { strictLimiter } from "../middleware/rateLimit-middleware.js";
import userController from "../controller/user-controller.js";
import itemController from "../controller/item-controller.js";
import categoryController from "../controller/category-controller.js";
import claimController from "../controller/claim-controller.js";
import commentController from "../controller/comment-controller.js";
import boostController from "../controller/boost-controller.js";
import { uploadMiddleware } from "../middleware/upload-middleware.js";
import uploadController from "../controller/upload-controller.js";

const userRouter = express.Router();

// User Routes
userRouter.get("/api/users/current", authMiddleware, userController.get);
userRouter.patch("/api/users/current", authMiddleware, userController.update);
userRouter.delete("/api/users/logout", authMiddleware, userController.logout);

// ITEM ROUTES 
userRouter.get("/api/items", authMiddleware, itemController.getAll);
userRouter.get("/api/items/:itemId", authMiddleware, itemController.get);
userRouter.post("/api/items", authMiddleware, strictLimiter, itemController.create);
userRouter.patch("/api/items/:itemId", authMiddleware, itemController.update);
userRouter.delete("/api/items/:itemId", authMiddleware, itemController.remove);

// ITEM COMMENTS & BOOSTS ROUTES
userRouter.post("/api/items/:itemId/comments", authMiddleware, strictLimiter, commentController.create);
userRouter.patch("/api/comments/:commentId", authMiddleware, commentController.update);
userRouter.delete("/api/comments/:commentId", authMiddleware, commentController.remove);
userRouter.post("/api/items/:itemId/boost", authMiddleware, boostController.toggle);

// FILE UPLOAD ROUTE
userRouter.post("/api/upload", authMiddleware, uploadMiddleware.single("image"), uploadController.upload);

//  CATEGORY ROUTES 
userRouter.get("/api/categories/:categoryId", authMiddleware, categoryController.get);
userRouter.post("/api/categories", authMiddleware, adminMiddleware, categoryController.create);
userRouter.patch("/api/categories/:categoryId", authMiddleware, adminMiddleware, categoryController.update);

// --- CLAIM ROUTES ---
userRouter.get("/api/claims", authMiddleware, claimController.getAll);
userRouter.get("/api/claims/:claimId", authMiddleware, claimController.get);
userRouter.post("/api/claims", authMiddleware, strictLimiter, claimController.create);
userRouter.patch("/api/claims/:claimId", authMiddleware, claimController.update);
userRouter.delete("/api/claims/:claimId", authMiddleware, claimController.remove);


// --- ADMIN USER MANAGEMENT ROUTES ---
userRouter.get("/api/users", authMiddleware, adminMiddleware, userController.getAllUsers);
userRouter.post("/api/users", authMiddleware, adminMiddleware, userController.createUser);
userRouter.patch("/api/users/:userId", authMiddleware, adminMiddleware, userController.updateUser);
userRouter.delete("/api/users/:userId", authMiddleware, adminMiddleware, userController.deleteUser);

export {
    userRouter
}
