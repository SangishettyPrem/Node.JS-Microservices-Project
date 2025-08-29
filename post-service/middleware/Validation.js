const Joi = require('joi');

const validateCreatePost = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(5000).required(),
        mediaUrls: Joi.array()
    })
    return schema.validate(data);
}


module.exports = validateCreatePost