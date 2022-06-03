const ErrorHandler = require('../utils/errorHandler')
const jwt = require('jsonwebtoken')
const catchAsyncErrors = require('./catchAsyncErrors')
const User = require('../models/user')

// check if user is authenticated or not
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies

  if (!token) {
    return next(new ErrorHandler('Login first to access this resource', 401))
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  req.user = await User.findById(decoded.id)

  next()
})

// Handling users roles
exports.authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role of: (${req.user.role}) is not authorized to access this route.  `,
          403
        )
      )
    }

    next()
  }
}
