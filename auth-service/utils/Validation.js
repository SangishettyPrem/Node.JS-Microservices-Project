const Joi = require('joi');


const RegisterUserValidation = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(3)

});

const UserLoginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required().min(3)
});



module.exports = {
    RegisterUserValidation,
    UserLoginValidation
}