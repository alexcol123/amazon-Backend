// const express = require('express')
// const router = express.Router()
// const { isAuthenticatedUser, authorizedRoles } = require('../middlewares/auth')

// const {
//   processPayment,
//   sendStripApi,
// } = require('../controllers/paymentController')

// router.route('/payment/process').post(isAuthenticatedUser, processPayment)
// router.route('/stripeapi').get(isAuthenticatedUser, sendStripeApi)

// module.exports = router

const express = require('express')
const router = express.Router()

const {
  processPayment,
  sendStripApi,
} = require('../controllers/paymentController')

const { isAuthenticatedUser } = require('../middlewares/auth')

router.route('/payment/process').post(isAuthenticatedUser, processPayment)
router.route('/stripeapi').get(isAuthenticatedUser, sendStripApi)

module.exports = router
