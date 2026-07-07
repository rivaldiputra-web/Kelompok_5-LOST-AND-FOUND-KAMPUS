import boostService from "../service/boost-service.js";

const toggle = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.itemId, 10);
        const result = await boostService.toggle(userId, itemId);
        res.status(200).json({
            status: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    toggle
};
