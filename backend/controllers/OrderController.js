const Order = require('../models/order')
const Product = require('../models/product')

const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')

// Create new order =>  /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body

  const order = await Order.create({
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
  })

  res.status(201).json({
    success: true,
    order,
  })
})

// Get single order  =>  /api/v1/order/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )

  if (!order) {
    return next(
      new ErrorHandler('No Order was found with id:' + req.params.id, 404)
    )
  }

  res.status(200).json({
    success: true,
    order,
  })
})

// Get logged in user orders  =>  /api/v1/orders/me
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })

  if (!orders) {
    return next(new ErrorHandler('You have no orders ', 404))
  }

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  })
})

///     Admin Routes
//___________________________________________

// ADMIN  Get all  orders   =>  /api/v1/admin/orders
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find()

  if (!orders) {
    return next(new ErrorHandler('You have no orders ', 404))
  }

  let totalAmount = 0

  orders.forEach((order) => {
    totalAmount += order.totalPrice
  })

  res.status(200).json({
    success: true,
    totalAmount,
    count: orders.length,
    orders,
  })
})

// ADMIN  Update / Process order - ADMIN  =>   /api/v1/admin/order/:id
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    return next(new ErrorHandler('You have no orders ', 404))
  }

  if (order.orderStatus === 'Delivered') {
    return next(new ErrorHandler('You have already delivered this order', 400))
  }

  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity)
  })
  ;(order.orderStatus = req.body.status), (order.deliveredAt = Date.now())

  await order.save()

  res.status(200).json({
    success: true,
  })
})

// helper function to update stock
async function updateStock(id, quantity) {
  const product = await Product.findById(id)

  product.stock = product.stock - quantity

  await product.save({ validateBeforeSave: false })
}

// ADMIN  Delete  order  =>   /api/v1/admin/order/:id
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    return next(
      new ErrorHandler('No order found with Id:' + req.params.id, 404)
    )
  }

  await order.remove()

  res.status(200).json({
    success: true,
  })
})
