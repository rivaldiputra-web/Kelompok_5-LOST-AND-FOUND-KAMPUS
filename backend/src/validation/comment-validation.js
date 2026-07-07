import Joi from 'joi';

const createCommentValidation = Joi.object({
    text: Joi.string().required()
});

const updateCommentValidation = Joi.object({
    text: Joi.string().required()
});

export {
    createCommentValidation,
    updateCommentValidation
}
