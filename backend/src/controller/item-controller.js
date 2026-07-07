import itemService from "../service/item-service.js";

const getAll = async (req, res, next) => {
    try {
        const request = {
            page: req.query.page ? parseInt(req.query.page, 10) : undefined,
            size: req.query.size ? parseInt(req.query.size, 10) : undefined,
            q: req.query.q,
            category_id: req.query.category_id ? parseInt(req.query.category_id, 10) : undefined,
            type: req.query.type,
            status: req.query.status,
            user_id: req.query.user_id ? parseInt(req.query.user_id, 10) : undefined,
            current_user_id: req.user ? req.user.id : undefined,
            sort_by: req.query.sort_by
        };

        const result = await itemService.getAll(request);
        
        res.status(200).json({
            status: true,
            data: result.data,
            meta: result.pagination
        });
    } catch (e) {
        next(e);
    }
};

const create = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const result = await itemService.create(userId, req.body);
        
        res.status(201).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const get = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId, 10); 
        const currentUserId = req.user ? req.user.id : undefined;
        const result = await itemService.get(itemId, currentUserId);
        
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const update = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId, 10);
        
        const result = await itemService.update(req.user, itemId, req.body);
        
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const remove = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId, 10);
        await itemService.remove(req.user, itemId);
        
        res.status(200).json({
            status: true,
            data: "Barang berhasil dihapus"
        });
    } catch (e) {
        next(e);
    }
};

export default {
    getAll,
    create,
    get,
    update,
    remove
};