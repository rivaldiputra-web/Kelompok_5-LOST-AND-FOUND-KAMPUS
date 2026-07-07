import { prismaClient } from "../application/database.js";
import { validate } from "../validation/validation.js";
import { 
    createItemValidation, 
    getItemValidation, 
    updateItemValidation,
    queryItemValidation
} from "../validation/item-validation.js";
import { ResponseError } from "../error/response-error.js";
import { redisClient } from "../application/redis.js";

// HELPER: Menghapus cache menggunakan metode SCAN yang aman untuk produksi
const clearPaginationCache = async () => {
    let cursor = '0';
    do {
        // SCAN tidak akan membekukan server Redis seperti KEYS
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

const getAll = async (request) => {
    const validRequest = validate(queryItemValidation, request);
    
    const page = validRequest.page;
    const size = validRequest.size;
    const skip = (page - 1) * size;

    const where = {};
    if (validRequest.category_id) {
        where.category_id = validRequest.category_id;
    }
    if (validRequest.type) {
        where.type = validRequest.type;
    }
    if (validRequest.status) {
        where.status = validRequest.status;
    } else {
        // Exclude items waiting for admin verification from the public feed.
        // However, allow users to see their own pending items on their profile page.
        if (!validRequest.user_id) {
            where.status = {
                not: 'pending_verification'
            };
        }
    }
    if (validRequest.user_id) {
        where.user_id = validRequest.user_id;
    }
    if (validRequest.q) {
        where.OR = [
            { title: { contains: validRequest.q } },
            { description: { contains: validRequest.q } }
        ];
    }

    const cacheKeyParts = [`page:${page}`, `size:${size}`];
    if (validRequest.category_id) cacheKeyParts.push(`category_id:${validRequest.category_id}`);
    if (validRequest.type) cacheKeyParts.push(`type:${validRequest.type}`);
    if (validRequest.status) cacheKeyParts.push(`status:${validRequest.status}`);
    if (validRequest.user_id) cacheKeyParts.push(`user_id:${validRequest.user_id}`);
    if (validRequest.q) cacheKeyParts.push(`q:${encodeURIComponent(validRequest.q)}`);
    if (validRequest.sort_by) cacheKeyParts.push(`sort_by:${validRequest.sort_by}`);
    const cacheKeyAllItems = `items:${cacheKeyParts.join(':')}`;

    let result;
    const cachedAllItems = await redisClient.get(cacheKeyAllItems);
    if (cachedAllItems) {
        result = JSON.parse(cachedAllItems);
    } else {
        let orderBy = { created_at: 'desc' };
        if (validRequest.sort_by === 'boosts') {
            orderBy = [
                { boosts: { _count: 'desc' } },
                { created_at: 'desc' }
            ];
        }

        const [items, totalItems] = await prismaClient.$transaction([
            prismaClient.item.findMany({
                where: where,
                skip: skip,
                take: size,
                include: {
                    category: true,
                    user: { select: { name: true } },
                    _count: {
                        select: { boosts: true, comments: true }
                    },
                    boosts: {
                        select: { user_id: true }
                    }
                },
                orderBy: orderBy
            }),
            prismaClient.item.count({ where: where })
        ]);

        result = {
            data: items,
            pagination: {
                page: page,
                size: size,
                total_items: totalItems,
                total_pages: Math.ceil(totalItems / size)
            }
        };

        await redisClient.setEx(cacheKeyAllItems, 3600, JSON.stringify(result));
    }

    const currentUserId = validRequest.current_user_id;
    const mappedData = result.data.map(item => {
        const hasBoosted = currentUserId ? item.boosts?.some(b => b.user_id === parseInt(currentUserId, 10)) : false;
        return {
            ...item,
            boost_count: item._count?.boosts || 0,
            comment_count: item._count?.comments || 0,
            is_boosted_by_me: !!hasBoosted,
            boosts: undefined
        };
    });

    return {
        data: mappedData,
        pagination: result.pagination
    };
};

const generateUniqueSlug = async (title) => {
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = "item";
    
    let uniqueSlug = baseSlug;
    let count = 0;
    while (true) {
        const existing = await prismaClient.item.count({
            where: { slug: uniqueSlug }
        });
        if (existing === 0) {
            break;
        }
        count++;
        uniqueSlug = `${baseSlug}-${count}`;
    }
    return uniqueSlug;
};

const create = async (userId, request) => {
    const item = validate(createItemValidation, request);
    
    const categoryExists = await prismaClient.category.count({
        where: { id: item.category_id }
    });

    if (categoryExists !== 1) {
        throw new ResponseError(404, "Kategori tidak ditemukan");
    }

    item.user_id = parseInt(userId, 10);
    // while found items go to 'pending_verification' (requires admin verification for security).
    item.status = item.type === 'lost' ? 'searching' : 'pending_verification';
    item.slug = await generateUniqueSlug(item.title);

    const newItem = await prismaClient.item.create({
        data: item,
        include: { 
            category: true,
            user: {
                select: { name: true, phone_number: true }
            }
        }
    });
    await clearPaginationCache();
    return newItem;
};

const get = async (itemIdOrSlug, currentUserId) => {
    itemIdOrSlug = validate(getItemValidation, itemIdOrSlug);
    const isId = /^\d+$/.test(String(itemIdOrSlug));
    
    let item;
    if (isId) {
        const itemId = parseInt(itemIdOrSlug, 10);
        const cacheKeySingle = `item:${itemId}`;
        const cachedItem = await redisClient.get(cacheKeySingle);
        
        if (cachedItem) {
            item = JSON.parse(cachedItem);
        } else {
            item = await prismaClient.item.findUnique({
                where: { id: itemId },
                include: {
                    category: true,
                    user: { select: { name: true, phone_number: true } },
                    _count: {
                        select: { boosts: true, comments: true }
                    },
                    boosts: {
                        select: { user_id: true }
                    }
                }
            });

            if (item) {
                await redisClient.setEx(cacheKeySingle, 3600, JSON.stringify(item));
            }
        }
    } else {
        const cacheKeySlug = `item:slug:${itemIdOrSlug}`;
        const cachedItem = await redisClient.get(cacheKeySlug);
        
        if (cachedItem) {
            item = JSON.parse(cachedItem);
        } else {
            item = await prismaClient.item.findUnique({
                where: { slug: String(itemIdOrSlug) },
                include: {
                    category: true,
                    user: { select: { name: true, phone_number: true } },
                    _count: {
                        select: { boosts: true, comments: true }
                    },
                    boosts: {
                        select: { user_id: true }
                    }
                }
            });

            if (item) {
                await redisClient.setEx(cacheKeySlug, 3600, JSON.stringify(item));
            }
        }
    }

    if (!item) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const hasBoosted = currentUserId ? item.boosts?.some(b => b.user_id === parseInt(currentUserId, 10)) : false;
    return {
        ...item,
        boost_count: item._count?.boosts || 0,
        comment_count: item._count?.comments || 0,
        is_boosted_by_me: !!hasBoosted,
        boosts: undefined
    };
};

const update = async (user, itemId, request) => {
    itemId = validate(getItemValidation, itemId);
    const itemReq = validate(updateItemValidation, request);
    const numericId = parseInt(itemId, 10);

    const itemInDb = await prismaClient.item.findUnique({
        where: { id: numericId }
    });

    if (!itemInDb) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const isAdmin = user.role === 'admin';
    const isOwner = itemInDb.user_id === parseInt(user.id, 10);

    if (!isAdmin && !isOwner) {
        throw new ResponseError(403, "Anda tidak memiliki akses untuk mengubah barang ini");
    }

    if (!isAdmin && itemReq.status) {
        if (itemInDb.type === 'found') {
            throw new ResponseError(403, "Hanya admin yang dapat mengubah status barang temuan (found)");
        }
        if (!['searching', 'resolved'].includes(itemReq.status)) {
            throw new ResponseError(400, "Status tidak valid untuk barang hilang (lost)");
        }
    }

    if (isAdmin && itemReq.status === 'available' && itemInDb.status === 'pending_verification') {
        itemReq.verified_by_id = parseInt(user.id, 10);
        itemReq.verified_at = new Date();
    }

    const updatedItem = await prismaClient.item.update({
        where: { id: numericId },
        data: itemReq
    });
    
    await redisClient.del(`item:${numericId}`);
    if (itemInDb.slug) {
        await redisClient.del(`item:slug:${itemInDb.slug}`);
    }
    await clearPaginationCache();

    return updatedItem;
};

const remove = async (user, itemId) => {
    itemId = validate(getItemValidation, itemId);
    const numericId = parseInt(itemId, 10);

    const itemInDb = await prismaClient.item.findUnique({
        where: { id: numericId }
    });

    if (!itemInDb) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    const isAdmin = user.role === 'admin';
    const isOwner = itemInDb.user_id === parseInt(user.id, 10);

    if (!isAdmin && !isOwner) {
        throw new ResponseError(403, "Anda tidak memiliki akses untuk menghapus barang ini");
    }

    await prismaClient.item.delete({
        where: { id: numericId }
    });

    await redisClient.del(`item:${numericId}`);
    if (itemInDb.slug) {
        await redisClient.del(`item:slug:${itemInDb.slug}`);
    }
    await clearPaginationCache();
};

export default {
    getAll,
    create,
    get,
    update,
    remove
};