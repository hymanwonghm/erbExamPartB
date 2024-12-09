// Importing modeules
const express = require('express')
// Importing routers
const { router } = require('./routers')

// Define express app
const app = express()
const port = 3000

// Enable express app to parase JSON body
app.use(express.json())
app.use(express.urlencoded({extended: true}))
// Using routers and controllers
app.use('/', router)

// Starting express app server
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})