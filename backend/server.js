const app = require('./app')
const dotenv = require('dotenv')
const cloudinary = require('cloudinary')

// Handle uncaught exeptions
process.on('uncaughtException', (err) => {
  console.log(`ERROR: ${err.message}`)
  console.log('Shutting down server due to uncaught exeptions.')
  console.log(`ERROR: ${err.stack}`)
  process.exit(1)
})

const connectDatabase = require('./config/database')

// setting up config file
dotenv.config({ path: 'backend/config/config.env' })

// Connecting to Database
connectDatabase()

// Setting up cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server runnin on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  )
})

// Handle unhandle promise rejection
process.on('unhandledRejection', (err) => {
  console.log(`ERROR: ${err.message}`)
  console.log('Shutting down the server due to unhandle promise rejections')
  server.close(() => {
    process.exit(1)
  })
})
