const Product = require('../models/product')
const dotenv = require('dotenv')
const connectDatabase = require('../config/database')

const products = require('../data/products')

// Settings  dotenv file
dotenv.config({ path: 'backend/config/config.env' })

connectDatabase()

const seedProducts = async () => {
  try {
    await Product.deleteMany()
    console.log('Products have been deleted')

    await Product.insertMany(products)
    console.log('Products have been Added')
    process.exit()
  } catch (error) {
    console.log(error)
    process.exit()
  }
}

seedProducts()
