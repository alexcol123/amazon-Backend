const User = require('../models/user')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')

// Register a user   => /api/v1/register
// Register a user   => /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: 'avatars',
    width: 150,
    crop: 'scale',
  })

  const { name, email, password } = req.body

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  })

  sendToken(user, 200, res)
})

// Login User  =>  /a[i/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body

  // Checks if email and password is entered by user
  if (!email || !password) {
    return next(new ErrorHandler('Please enter email & password', 400))
  }

  // Finding user in database
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorHandler('Invalid Email or Password', 401))
  }

  // Checks if password is correct or not
  const isPasswordMatched = await user.comparePassword(password)

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid Email or Password', 401))
  }

  sendToken(user, 200, res)
})

// Forgot Password   =? /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorHandler('User not found with this email ', 404))
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Create reset password url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`

  const message = `Your password reset token is as follow:\n\n${resetUrl}\n\n If you have not requested this email, then ignore it.`

  try {
    await sendEmail({
      email: user.email,
      subject: 'ShopIt Password Recovery',
      message,
    })

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorHandler(error.message, 500))
  }
})

// Forgot Password   =? /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Hase URL token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(
      new ErrorHandler(
        'Password reset token is invalid or has been expired ',
        400
      )
    )
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Passwords do not match,', 400))
  }

  console.log(req.body)

  // Setup New Password
  user.password = req.body.password

  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()

  sendToken(user, 200, res)
})

// Get currently logged in user details  => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    user,
  })
})

// Update / Change  password = >  /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  //Check previous user password
  const isMatch = await user.comparePassword(req.body.oldPassword)

  if (!isMatch) {
    return next(new ErrorHandler('OldPassword is incorrect,', 400))
  }

  user.password = req.body.password
  await user.save()

  sendToken(user, 200, res)
})

// Update user profile   =>   /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  }

  // Update avatar
  if (req.body.avatar !== '') {
    const user = await User.findById(req.user.id)

    console.log(user)
    const image_id = user.avatar.public_id
    const res = await cloudinary.v2.uploader.destroy(image_id)

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    })

    newUserData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  res.status(200).json({
    success: true,
  })
})

// Logout a user   => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    message: 'Logout succesfully',
  })
})

// __________      ADMIN ROUTES        __________
//   __________     __________     _________

// Get currently logged in user details  => /api/v1/me
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find()

  res.status(200).json({
    count: users.length,
    success: true,
    users,
  })
})

// Get User details  => /api/v1/user/:id
// Get user details   =>   /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`)
    )
  }

  res.status(200).json({
    success: true,
    user,
  })
})

// Update User Profile /  = >  /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  }

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    user,
  })
})

// Delete user   =>   /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(
      new ErrorHandler(`User does not found with id: ${req.params.id}`)
    )
  }

  // Remove avatar from cloudinary
  const image_id = user.avatar.public_id
  await cloudinary.v2.uploader.destroy(image_id)

  await user.remove()

  res.status(200).json({
    success: true,
  })
})
