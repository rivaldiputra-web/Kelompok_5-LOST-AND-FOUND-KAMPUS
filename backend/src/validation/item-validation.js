import Joi from 'joi';

const createItemValidation = Joi.object({
    category_id: Joi.number().positive().required(),
    type: Joi.string().valid('lost', 'found').required(),
    title: Joi.string().max(255).required(),
    description: Joi.string().required(),
    location: Joi.string().max(255).required(),
    date_time: Joi.date().iso().required(),
    image_path: Joi.string().max(255).optional()
});

const getItemValidation = Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().max(255)
).required();

const updateItemValidation = Joi.object({
    category_id: Joi.number().positive().optional(),
    type: Joi.string().valid('lost', 'found').optional(),
    title: Joi.string().max(255).optional(),
    description: Joi.string().optional(),
    location: Joi.string().max(255).optional(),
    date_time: Joi.date().iso().optional(),
    image_path: Joi.string().max(255).optional(),
    status: Joi.string().valid('pending_verification', 'available', 'returned', 'searching', 'resolved').optional()
});

const queryItemValidation = Joi.object({
    page: Joi.number().min(1).default(1),
    size: Joi.number().min(1).max(100).default(10),
    q: Joi.string().max(255).optional(),
    category_id: Joi.number().positive().optional(),
    type: Joi.string().valid('lost', 'found').optional(),
    status: Joi.string().valid('pending_verification', 'available', 'returned', 'searching', 'resolved').optional(),
    user_id: Joi.number().positive().optional(),
    current_user_id: Joi.number().positive().optional(),
    sort_by: Joi.string().valid('created_at', 'boosts').optional()
});

export {
    createItemValidation,
    getItemValidation,
    updateItemValidation,
    queryItemValidation
}