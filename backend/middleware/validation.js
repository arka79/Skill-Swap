import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

export const validateRegistration = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateProfileUpdate = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('location').optional().trim(),
  body('availability').optional().trim(),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  handleValidationErrors
];

export const validateSwapRequest = [
  body('toUserId').isMongoId().withMessage('Valid user ID is required'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('skillsOffered').isArray().withMessage('Skills offered must be an array'),
  body('skillsRequested').isArray().withMessage('Skills requested must be an array'),
  handleValidationErrors
];

export const validateRating = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters'),
  handleValidationErrors
]; 