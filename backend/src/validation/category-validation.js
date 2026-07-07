import Joi from 'joi';

const createCategoryValidation = Joi.object({
    name: Joi.string().max(100).required(),    
});

const getCategoryValidation = 
    Joi.number().min(1).positive().required();

const updateCategoryValidation = Joi.object({
    name: Joi.string().max(100).required(),    
});

export { 
    createCategoryValidation,
    getCategoryValidation,
    updateCategoryValidation
};