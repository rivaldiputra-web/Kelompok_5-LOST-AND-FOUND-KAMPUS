import { prismaClient } from "../application/database.js";
import { validate } from "../validation/validation.js";
import { 
    createClaimValidation, 
    getClaimValidation, 
    updateClaimValidation,
    queryClaimValidation
} from "../validation/claim-validation.js";
import { ResponseError } from "../error/response-error.js";
import { redisClient } from "../application/redis.js";

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

const create = async (userId, request) => {
    const claim = validate(createClaimValidation, request);

    const itemInDb = await prismaClient.item.findUnique({
        where: { id: claim.item_id }
    });

    if (!itemInDb) {
        throw new ResponseError(404, "Barang tidak ditemukan");
    }

    if (itemInDb.type !== 'found') {
        throw new ResponseError(400, "Hanya barang temuan (found) yang bisa diklaim");
    }
    
    if (itemInDb.status === 'returned' || itemInDb.status === 'resolved') {
        throw new ResponseError(400, "Barang ini sudah dikembalikan atau selesai diproses");
    }

    if (itemInDb.user_id === parseInt(userId, 10)) {
        throw new ResponseError(400, "Anda tidak dapat mengklaim barang yang Anda laporkan sendiri");
    }

    const existingClaim = await prismaClient.claim.findFirst({
        where: {
            item_id: claim.item_id,
            user_id: parseInt(userId, 10)
        }
    });

    if (existingClaim) {
        throw new ResponseError(400, "Anda sudah mengajukan klaim untuk barang ini");
    }

    claim.user_id = parseInt(userId, 10);
    claim.status = 'pending'; 

    return prismaClient.claim.create({
        data: claim,
        include: {
            item: { select: { title: true, type: true } }
        }
    });
};

const get = async (claimId) => {
    claimId = validate(getClaimValidation, claimId);

    const claim = await prismaClient.claim.findUnique({
        where: { id: claimId },
        include: {
            item: true,
            user: { select: { name: true, email: true, phone_number: true } },
            processed_by: { select: { name: true } }
        }
    });

    if (!claim) {
        throw new ResponseError(404, "Data klaim tidak ditemukan");
    }

    return claim;
};

const getAll = async (user, request) => {
    const validRequest = validate(queryClaimValidation, request);
    const page = validRequest.page;
    const size = validRequest.size;
    const skip = (page - 1) * size;

    const where = {};
    
    if (user.role === 'admin') {
        if (validRequest.item_id) where.item_id = validRequest.item_id;
        if (validRequest.status) where.status = validRequest.status;
    } else {
        const userId = parseInt(user.id, 10);
        where.OR = [
            { user_id: userId },
            { item: { user_id: userId } }
        ];
        if (validRequest.item_id) {
            where.item_id = validRequest.item_id;
        }
        if (validRequest.status) {
            where.status = validRequest.status;
        }
    }

    const [claims, totalClaims] = await prismaClient.$transaction([
        prismaClient.claim.findMany({
            where: where,
            skip: skip,
            take: size,
            include: {
                item: {
                    select: {
                        title: true,
                        type: true,
                        user_id: true,
                        location: true,
                        user: {
                            select: { name: true }
                        }
                    }
                },
                user: {
                    select: { name: true, nim_nip: true, email: true, phone_number: true }
                },
                processed_by: {
                    select: { name: true }
                }
            },
            orderBy: { created_at: 'desc' }
        }),
        prismaClient.claim.count({ where: where })
    ]);

    return {
        data: claims,
        pagination: {
            page: page,
            size: size,
            total_items: totalClaims,
            total_pages: Math.ceil(totalClaims / size)
        }
    };
};

const update = async (user, claimId, request) => {
    claimId = validate(getClaimValidation, claimId);
    const claimReq = validate(updateClaimValidation, request);
    
    const claimInDb = await prismaClient.claim.findUnique({
        where: { id: claimId },
        include: { item: true }
    });

    if (!claimInDb) {
        throw new ResponseError(404, "Data klaim tidak ditemukan");
    }

    if (claimReq.proof_description || claimReq.proof_image_path) {
        if (claimInDb.user_id.toString() !== user.id.toString()) {
            throw new ResponseError(403, "Anda tidak berhak mengubah data klaim milik orang lain");
        }
        
        if (claimInDb.status !== 'pending') {
            throw new ResponseError(400, "Tidak dapat mengubah bukti karena klaim ini sudah diproses");
        }
    }

    if (claimReq.status) {
        if (user.role !== 'admin') {
            throw new ResponseError(403, "Akses ditolak. Hanya admin yang dapat menyetujui atau menolak klaim");
        }

        claimReq.processed_by_id = parseInt(user.id, 10);
        claimReq.processed_at = new Date();

        if (claimReq.status === 'approved') {
            const [updatedClaim, updatedItem] = await prismaClient.$transaction([
                prismaClient.claim.update({
                    where: { id: claimId },
                    data: {
                        status: 'approved',
                        processed_by_id: claimReq.processed_by_id,
                        processed_at: claimReq.processed_at,
                        admin_notes: claimReq.admin_notes || null
                    }
                }),
                prismaClient.item.update({
                    where: { id: claimInDb.item_id },
                    data: { status: 'returned' }
                })
            ]);
            await redisClient.del(`item:${claimInDb.item_id}`);
            if (claimInDb.item?.slug) {
                await redisClient.del(`item:slug:${claimInDb.item.slug}`);
            }
            await clearPaginationCache();
            return updatedClaim;
        }
    }
    
    return prismaClient.claim.update({
        where: { id: claimId },
        data: claimReq
    });
};

const remove = async (user, claimId) => {
    claimId = validate(getClaimValidation, claimId);

    const claimInDb = await prismaClient.claim.findUnique({
        where: { id: claimId }
    });

    if (!claimInDb) {
        throw new ResponseError(404, "Data klaim tidak ditemukan");
    }

    const isAdmin = user.role === 'admin';
    const isOwner = claimInDb.user_id === parseInt(user.id, 10);

    if (!isAdmin && !isOwner) {
        throw new ResponseError(403, "Anda tidak memiliki akses untuk menghapus klaim ini");
    }

    if (!isAdmin && claimInDb.status !== 'pending') {
        throw new ResponseError(400, "Klaim yang sudah diproses oleh admin tidak dapat dihapus");
    }

    await prismaClient.claim.delete({
        where: { id: claimId }
    });
};

export default {
    create,
    get,
    getAll,
    update,
    remove
};