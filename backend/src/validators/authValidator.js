const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    password: z.string().min(8).optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
};
