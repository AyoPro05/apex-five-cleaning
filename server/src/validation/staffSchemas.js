import Joi from 'joi';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const phonePattern = /^[\d\s+().-]+$/;
const time = Joi.string().trim().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);
const rate = Joi.number().min(0).max(10000).precision(2).strict();
const objectId = Joi.string().hex().length(24);

const availabilitySlot = Joi.object({
  day: Joi.string().valid(...days).required(),
  startTime: time.required(),
  endTime: time.required().custom((value, helpers) => (
    value <= helpers.state.ancestors[0].startTime
      ? helpers.message({ custom: 'End time must be after start time' })
      : value
  )),
}).unknown(false);

const staffFields = {
  firstName: Joi.string().trim().min(1).max(60),
  lastName: Joi.string().trim().min(1).max(60),
  email: Joi.string().trim().lowercase().max(254).email({ tlds: { allow: false } }).allow(''),
  phone: Joi.string().trim().min(7).max(30).pattern(phonePattern),
  role: Joi.string().valid('cleaner', 'supervisor', 'admin'),
  employmentType: Joi.string().valid('full-time', 'part-time', 'contractor'),
  hourlyRate: rate,
  serviceAreas: Joi.array().items(Joi.string().trim().min(1).max(80)).max(20).unique(),
  availability: Joi.array().items(availabilitySlot).max(14),
  emergencyContactName: Joi.string().trim().max(120).allow(''),
  emergencyContactPhone: Joi.string().trim().max(30).pattern(phonePattern).allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  notes: Joi.string().trim().max(1000).allow(''),
};

export const staffCreateSchema = Joi.object({
  ...staffFields,
  firstName: staffFields.firstName.required(),
  lastName: staffFields.lastName.required(),
  phone: staffFields.phone.required(),
}).unknown(false).required();

export const staffUpdateSchema = Joi.object(staffFields).min(1).unknown(false).required();

const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
    ? helpers.message({ custom: 'Date must be a valid calendar date in YYYY-MM-DD format' })
    : value;
});

const shiftFields = {
  staffId: objectId,
  quoteId: objectId.allow(''),
  date,
  startTime: time,
  endTime: time.custom((value, helpers) => {
    const start = helpers.state.ancestors[0].startTime;
    return start !== undefined && value <= start
      ? helpers.message({ custom: 'End time must be after start time' })
      : value;
  }),
  breakMinutes: Joi.number().integer().min(0).max(1439).strict().custom((value, helpers) => {
    const { startTime, endTime } = helpers.state.ancestors[0];
    if (startTime && endTime) {
      const minutes = (clock) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
      if (value >= minutes(endTime) - minutes(startTime)) {
        return helpers.message({ custom: 'Break must be shorter than the shift duration' });
      }
    }
    return value;
  }),
  hourlyRateSnapshot: rate,
  location: Joi.string().trim().max(240).allow(''),
  notes: Joi.string().trim().max(1000).allow(''),
  status: Joi.string().valid('scheduled', 'completed', 'approved', 'paid', 'cancelled'),
};

export const shiftCreateSchema = Joi.object({
  ...shiftFields,
  status: Joi.string().valid('scheduled', 'completed'),
  staffId: shiftFields.staffId.required(),
  date: shiftFields.date.required(),
  startTime: shiftFields.startTime.required(),
  endTime: shiftFields.endTime.required(),
}).unknown(false).required();

export const shiftUpdateSchema = Joi.object(shiftFields).min(1).unknown(false).required();

export function validatePayload(schema, body) {
  const { error, value } = schema.validate(body, { abortEarly: false });
  const errors = {};
  // Joi skips this special object key; reject it like every other unknown field.
  if (body && Object.hasOwn(body, '__proto__')) {
    Object.defineProperty(errors, '__proto__', { value: '"__proto__" is not allowed', enumerable: true });
  }
  if (!error && Object.keys(errors).length === 0) {
    // Preserve the supplied key for PATCH so Mongoose clears an existing email.
    if (value.email === '') value.email = undefined;
    return { value };
  }
  for (const detail of error?.details || []) {
    const field = detail.path[0] || 'body';
    if (!Object.hasOwn(errors, field)) {
      Object.defineProperty(errors, field, { value: detail.message, enumerable: true });
    }
  }
  return { errors };
}
