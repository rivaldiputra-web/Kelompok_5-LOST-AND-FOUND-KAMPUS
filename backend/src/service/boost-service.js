import { prismaClient } from "../application/database.js";
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

const toggle = async (userId, itemId) => {
    const itemExists = await prismaClient.item.count({
        where: { id: itemId }
    });

    if (itemExists !== 1) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const existingBoost = await prismaClient.boost.findUnique({
        where: {
            item_id_user_id: {
                item_id: itemId,
                user_id: parseInt(userId, 10)
            }
        }
    });

    let boosted = false;
    if (existingBoost) {
        await prismaClient.boost.delete({
            where: {
                item_id_user_id: {
                    item_id: itemId,
                    user_id: parseInt(userId, 10)
                }
            }
        });
    } else {
        await prismaClient.boost.create({
            data: {
                item_id: itemId,
                user_id: parseInt(userId, 10)
            }
        });
        boosted = true;
    }

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

    const boostCount = await prismaClient.boost.count({
        where: { item_id: itemId }
    });

    return { boosted, boost_count: boostCount };
};

export default {
    toggle
};
