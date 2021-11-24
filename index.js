// Backend Modules
const { getTrades } = require('bit2c')
let cors = require('cors')
let express = require('express')
const PORT = 8090
require('dotenv').config()

let gapFinder = require('./tools/gapFinder')
let tradeFinder = require('./tools/tradeFinder')

let app = express()
app.use(cors())

app.listen(PORT, () => {
   console.log("Deal Breaker by Amir Burdini is live on " + PORT)
})

setInterval(gapFinder.fetchOrderBooks, 30 * 1000)

// setInterval(tradeFinder.fetchLastdayTrades, 60 * 60 * 24 * 1000)

// automation

// tradestation api

// calendar -CV