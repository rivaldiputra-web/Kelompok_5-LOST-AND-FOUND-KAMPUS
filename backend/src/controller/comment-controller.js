import commentService from "../service/comment-service.js";

const create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.itemId, 10);
        const result = await commentService.create(userId, itemId, req.body);
        res.status(201).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const list = async (req, res, next) => {
    try {
        const itemId = parseInt(req.params.itemId, 10);
        const result = await commentService.list(itemId);
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
        const userId = req.user.id;
        const commentId = parseInt(req.params.commentId, 10);
        const result = await commentService.update(userId, commentId, req.body);
        res.status(200).json({ status: true, data: result });
    } catch (e) {
        next(e);
    }
};

const remove = async (req, res, next) => {
    try {
        const commentId = parseInt(req.params.commentId, 10);
        await commentService.remove(req.user, commentId);
        res.status(200).json({ status: true, data: "Komentar berhasil dihapus" });
    } catch (e) {
        next(e);
    }
};

export default {
    create,
    list,
    update,
    remove
};
