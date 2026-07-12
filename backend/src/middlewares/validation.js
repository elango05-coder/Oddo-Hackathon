const { ValidationError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.reduce((acc, err) => {
        // Strip the top level identifier (body, query, params) from error keys
        const key = err.path.slice(1).join('.');
        acc[key || err.path[0]] = err.message;
        return acc;
      }, {});
      
      throw new ValidationError(errors, 'Validation error occurred');
    }

    // Override request properties with validated (and typed) parameters
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
