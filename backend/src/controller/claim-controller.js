import claimService from "../service/claim-service.js";

const create = async (req, res, next) => {
    try {
        const userId = req.user.id; 
        const result = await claimService.create(userId, req.body);
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
        const claimId = parseInt(req.params.claimId, 10);
        const result = await claimService.get(claimId);

        res.status(200).json({ 
            status: true,
            data: result 
        });
    } catch (e) {
        next(e);
    }
};

const getAll = async (req, res, next) => {
    try {
        const request = {
            page: req.query.page ? parseInt(req.query.page, 10) : undefined,
            size: req.query.size ? parseInt(req.query.size, 10) : undefined,
            item_id: req.query.item_id ? parseInt(req.query.item_id, 10) : undefined,
            status: req.query.status
        };

        const result = await claimService.getAll(req.user, request);
        res.status(200).json({
            status: true,
            data: result.data,
            meta: result.pagination
        });
    } catch (e) {
        next(e);
    }
};

const update = async (req, res, next) => {
    try {
        const user = req.user; 
        const claimId = parseInt(req.params.claimId, 10);
        const request = req.body;
        
        const result = await claimService.update(user, claimId, request);
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
        const claimId = parseInt(req.params.claimId, 10);
        await claimService.remove(req.user, claimId);
        res.status(200).json({
            status: true,
            data: "Klaim berhasil dihapus"
        });
    } catch (e) {
        next(e);
    }
};

export default {
    create,
    get,
    getAll,
    update,
    remove
};