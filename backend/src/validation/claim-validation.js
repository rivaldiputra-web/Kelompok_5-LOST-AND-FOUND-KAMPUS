import Joi from 'joi';

const createClaimValidation = Joi.object({
    item_id: Joi.number().positive().required(),
    proof_description: Joi.string().required(),
    proof_image_path: Joi.string().max(255).optional()
});

const getClaimValidation = Joi.number().positive().required();

const updateClaimValidation = Joi.object({
    proof_description: Joi.string().optional(),
    proof_image_path: Joi.string().max(255).optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    admin_notes: Joi.string().optional()
});

const queryClaimValidation = Joi.object({
    page: Joi.number().min(1).default(1),
    size: Joi.number().min(1).max(100).default(10),
    item_id: Joi.number().positive().optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected').optional()
});

export {
    createClaimValidation,
    getClaimValidation,
    updateClaimValidation,
    queryClaimValidation
}