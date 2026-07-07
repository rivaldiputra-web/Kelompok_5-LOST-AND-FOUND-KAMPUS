import Joi from "joi";

const registerUserValidation = Joi.object({
    nim_nip: Joi.string().max(50).required(),
    name: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(255).required(),
    phone_number: Joi.string().max(20).optional()
});

const loginUserValidation = Joi.object({
    email: Joi.string().max(255).required(), 
    password: Joi.string().max(255).required()
});

const getUserValidation = Joi.number().positive().required();

const updateUserValidation = Joi.object({
    id: Joi.number().positive().required(),
    nim_nip: Joi.string().max(50).optional(),
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().max(255).optional(),
    password: Joi.string().max(255).optional(),
    phone_number: Joi.string().max(20).optional()
});

const createUserByAdminValidation = Joi.object({
    nim_nip: Joi.string().max(50).required(),
    name: Joi.string().max(255).required(),
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(255).required(),
    phone_number: Joi.string().max(20).optional(),
    role: Joi.string().valid('admin','user').optional() 
});

const updateUserByAdminValidation = Joi.object({
    nim_nip: Joi.string().max(50).optional(),
    name: Joi.string().max(255).optional(),
    email: Joi.string().email().max(255).optional(),
    password: Joi.string().max(255).optional(),
    phone_number: Joi.string().max(20).optional(),
    role: Joi.string().valid('admin','user').optional()
});

export {
    registerUserValidation,
    loginUserValidation,
    getUserValidation,
    updateUserValidation,
    createUserByAdminValidation,
    updateUserByAdminValidation
}