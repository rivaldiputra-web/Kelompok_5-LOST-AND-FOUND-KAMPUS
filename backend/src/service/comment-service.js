import { prismaClient } from "../application/database.js";
import { validate } from "../validation/validation.js";
import { createCommentValidation, updateCommentValidation } from "../validation/comment-validation.js";
import { ResponseError } from "../error/response-error.js";
import { redisClient } from "../application/redis.js";

// Helper to clear pagination cache
const clearPaginationCache = async () => {
    let cursor = '0';
    do {
        const reply = await redisClient.scan(cursor, {
            MATCH: 'items:page:*',
            COUNT: 100
        });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } while (cursor !== '0');
};

const create = async (userId, itemId, request) => {
    const validRequest = validate(createCommentValidation, request);

    const itemExists = await prismaClient.item.count({
        where: { id: itemId }
    });

    if (itemExists !== 1) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const comment = await prismaClient.comment.create({
        data: {
            item_id: itemId,
            user_id: parseInt(userId, 10),
            text: validRequest.text
        },
        include: {
            user: { select: { name: true } }
        }
    });

    // Invalidate Redis cache
    await redisClient.del(`item:${itemId}`);
    const itemObj = await prismaClient.item.findUnique({
        where: { id: itemId },
        select: { slug: true }
    });
    if (itemObj?.slug) {
        await redisClient.del(`item:slug:${itemObj.slug}`);
    }
    await clearPaginationCache();

    return comment;
};

const list = async (itemId) => {
    const itemExists = await prismaClient.item.count({
        where: { id: itemId }
    });

    if (itemExists !== 1) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const comments = await prismaClient.comment.findMany({
        where: { item_id: itemId },
        include: {
            user: { select: { name: true } }
        },
        orderBy: { created_at: 'asc' }
    });

    return comments;
};

const update = async (userId, commentId, request) => {
    const validRequest = validate(updateCommentValidation, request);

    const comment = await prismaClient.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment) throw new ResponseError(404, "Komentar tidak ditemukan");
    if (comment.user_id !== parseInt(userId, 10)) throw new ResponseError(403, "Anda tidak berhak mengubah komentar ini");

    const updated = await prismaClient.comment.update({
        where: { id: commentId },
        data: { text: validRequest.text },
        include: { user: { select: { name: true } } }
    });

    return updated;
};

const remove = async (user, commentId) => {
    const comment = await prismaClient.comment.findUnique({
        where: { id: commentId }
    });

    if (!comment) throw new ResponseError(404, "Komentar tidak ditemukan");

    const isAdmin = user.role === 'admin';
    const isOwner = comment.user_id === parseInt(user.id, 10);

    if (!isAdmin && !isOwner) throw new ResponseError(403, "Anda tidak berhak menghapus komentar ini");

    await prismaClient.comment.delete({ where: { id: commentId } });

    await redisClient.del(`item:${comment.item_id}`);
    const itemObj = await prismaClient.item.findUnique({
        where: { id: comment.item_id },
        select: { slug: true }
    });
    if (itemObj?.slug) await redisClient.del(`item:slug:${itemObj.slug}`);
    await clearPaginationCache();
};

export default {
    create,
    list,
    update,
    remove
};
