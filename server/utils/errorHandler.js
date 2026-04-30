// centralized error handler - keeps controllers cleaner
const handleError = (res, error, customMsg) => {
  console.error(`[ERROR] ${customMsg || 'Something went wrong'}:`, error.message);

  // sequelize validation errors
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    const messages = error.errors.map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // generic
  return res.status(500).json({
    message: customMsg || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
};

module.exports = { handleError };
