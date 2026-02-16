const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, _next) => {
  const isDbError =
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    (err.message && err.message.includes('ECONNREFUSED'));
  const statusCode = err.statusCode || (isDbError ? 503 : 500);
  const message = isDbError
    ? 'Database unavailable. Please ensure MongoDB is running and MONGO_URI is set in .env'
    : (err.message || 'Internal Server Error');
  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };

