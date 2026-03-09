import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

/**
 * Validation middleware factory
 * Usage: router.post('/endpoint', validate(schema), handler)
 */
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors,
        },
      })
    }

    // Replace req.body with validated and sanitized data
    req.body = value
    next()
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Document registration
  registerDocument: Joi.object({
    id: Joi.string().required().max(100),
    name: Joi.string().required().max(255),
    folder: Joi.string().max(100).default('Upload'),
    type: Joi.string().valid('DSGD', 'QD', 'BieuMau').required(),
    source: Joi.string().valid('local', 'google_drive').default('local'),
    uploaded_at: Joi.string().isoDate().default(() => new Date().toISOString()),
  }),

  // OCR request
  ocrRequest: Joi.object({
    raw_text: Joi.string().max(1000000), // 1MB text limit
    document_type: Joi.string().valid('DSGD', 'QD', 'BieuMau'),
  }),

  // Student record
  studentRecord: Joi.object({
    stt: Joi.string().max(10),
    ho_ten: Joi.string().required().max(255),
    mssv: Joi.string().required().max(50),
    lop: Joi.string().max(50),
    diem_qp: Joi.number().min(0).max(10).allow(null),
    diem_lan2: Joi.number().min(0).max(10).allow(null),
    ket_qua: Joi.string().valid('Đạt', 'Không đạt', 'Học lại').allow(''),
    ghi_chu: Joi.string().max(500).allow(''),
  }),

  // Login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('name', 'date', 'type').default('date'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
}
