import Joi from 'joi';

const quoteValidationSchema = Joi.object({
  propertyType: Joi.string()
    .valid('house', 'flat', 'bungalow')
    .required()
    .messages({
      'string.empty': 'Please select a property type',
      'any.required': 'Property type is required',
      'any.only': 'Invalid property type selected'
    }),
    
  bedrooms: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.base': 'Bedrooms must be a number',
      'number.min': 'Property must have at least 1 bedroom',
      'number.max': 'Please enter a valid number (max 20)',
      'any.required': 'Number of bedrooms is required'
    }),
    
  bathrooms: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.base': 'Bathrooms must be a number',
      'number.min': 'Property must have at least 1 bathroom',
      'number.max': 'Please enter a valid number (max 20)',
      'any.required': 'Number of bathrooms is required'
    }),
    
  serviceType: Joi.string()
    .valid('residential', 'end-of-tenancy', 'airbnb', 'commercial')
    .required()
    .messages({
      'string.empty': 'Please select a service type',
      'any.required': 'Service type is required',
      'any.only': 'Invalid service type selected'
    }),
    
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must not exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'First name is required'
    }),
    
  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must not exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Last name is required'
    }),
    
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email address is required',
      'string.email': 'Please enter a valid email address (e.g., john@example.com)',
      'any.required': 'Email address is required'
    }),
    
  phone: Joi.string()
    .trim()
    .pattern(/^(?:\+44|0)(?:\d\s?){9,10}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid UK phone number (e.g., 01234 567890 or +44 1234 567890)',
      'any.required': 'Phone number is required'
    }),
    
  address: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Property address is required',
      'string.min': 'Address must be at least 5 characters',
      'string.max': 'Address must not exceed 200 characters',
      'any.required': 'Property address is required'
    }),
    
  additionalNotes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Additional notes must not exceed 500 characters'
    }),

  additionalServices: Joi.array()
    .items(Joi.string().valid(
      'interior-fridge-freezer',
      'interior-window-blind',
      'deep-tile-grout',
      'cabinet-cupboard-organization',
      'sanitizing-high-touch'
    ))
    .max(10)
    .optional()
    .default([])
    .messages({
      'array.max': 'Too many additional services selected'
    }),

  captchaToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'CAPTCHA verification failed',
      'any.required': 'CAPTCHA verification is required'
    })
});

export const validateQuoteData = (data) => {
  const { error, value } = quoteValidationSchema.validate(data, {
    abortEarly: false, // Return all errors, not just the first
    stripUnknown: true // Remove unknown fields
  });
  
  if (error) {
    const errors = {};
    error.details.forEach(detail => {
      const field = detail.path[0];
      errors[field] = detail.message;
    });
    return { isValid: false, errors };
  }
  
  return { isValid: true, value };
};

export const sanitizePhoneNumber = (phone) => {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/\s/g, '');
  
  // Convert to standard format
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+44' + cleaned;
  }
  
  return cleaned;
};

export const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

export const getFieldErrorMessage = (field, error) => {
  // Custom mapping for common validation errors
  const messages = {
    email: {
      'invalid': 'Please enter a valid email address',
      'required': 'Email address is required'
    },
    phone: {
      'invalid': 'Please enter a valid UK phone number',
      'required': 'Phone number is required'
    },
    firstName: {
      'invalid': 'First name can only contain letters and basic punctuation',
      'required': 'First name is required'
    },
    lastName: {
      'invalid': 'Last name can only contain letters and basic punctuation',
      'required': 'Last name is required'
    }
  };
  
  return messages[field]?.[error] || error;
};
