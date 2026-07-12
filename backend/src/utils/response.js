class ApiResponse {
  constructor(statusCode, success, message, data = null, meta = null) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(data, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, true, message, data, meta);
  }

  static created(data, message = 'Resource created successfully', meta = null) {
    return new ApiResponse(201, true, message, data, meta);
  }

  static error(message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      statusCode,
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return response;
  }
}

module.exports = ApiResponse;
