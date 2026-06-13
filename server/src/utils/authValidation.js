import Joi from "joi";

const emailSchema = Joi.string().trim().email({ tlds: { allow: false } }).required();

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).required(),
  lastName: Joi.string().trim().min(2).max(60).required(),
  email: emailSchema,
  phone: Joi.string().trim().pattern(/^[\d+\-()\s]{7,25}$/).required(),
  password: Joi.string().min(8).max(128).required(),
  passwordConfirm: Joi.string().required(),
  referralCode: Joi.string().trim().max(32).optional().allow(""),
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().min(1).max(128).required(),
  rememberMe: Joi.boolean().optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().min(20).max(4096).required(),
});

const updateMeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(60).optional(),
  lastName: Joi.string().trim().min(2).max(60).optional(),
  phone: Joi.string().trim().pattern(/^[\d+\-()\s]{7,25}$/).optional(),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow("").optional(),
    city: Joi.string().trim().max(120).allow("").optional(),
    postCode: Joi.string().trim().max(20).allow("").optional(),
    country: Joi.string().trim().max(80).allow("").optional(),
  }).optional(),
}).min(1);

const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(20).max(512).required(),
  password: Joi.string().min(8).max(128).required(),
  passwordConfirm: Joi.string().required(),
});

const run = (schema, payload) =>
  schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

export const validateRegisterPayload = (payload) => run(registerSchema, payload);
export const validateLoginPayload = (payload) => run(loginSchema, payload);
export const validateRefreshTokenPayload = (payload) => run(refreshTokenSchema, payload);
export const validateUpdateMePayload = (payload) => run(updateMeSchema, payload);
export const validateForgotPasswordPayload = (payload) => run(forgotPasswordSchema, payload);
export const validateResetPasswordPayload = (payload) => run(resetPasswordSchema, payload);

