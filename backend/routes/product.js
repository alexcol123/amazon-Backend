const express = require('express')
const router = express.Router()
const { isAuthenticatedUser, authorizedRoles } = require('../middlewares/auth')

const {
  getAdminProducts,
  getProducts,
  newProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/productController')

router.route('/products').get(getProducts)
router.route('/admin/products').get(getAdminProducts)

router.route('/admin/products/new').post(isAuthenticatedUser, newProduct)

router.route('/products/:id').get(getSingleProduct)
router
  .route('/admin/products/:id')
  .patch(isAuthenticatedUser, updateProduct)
  .delete(isAuthenticatedUser, deleteProduct)

router.route('/review').put(isAuthenticatedUser, createProductReview)
router.route('/reviews').get(isAuthenticatedUser, getProductReviews)

router.route('/reviews').delete(isAuthenticatedUser, deleteReview)

module.exports = router
