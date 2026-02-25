class AppError extends Error {
  constructor(message, statusCode = 400, extra = {}) {
    super(message);
    this.statusCode = statusCode;

    // attach extra data
    Object.assign(this, extra);

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
