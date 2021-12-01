require('dotenv').config()
const cors = require('cors')
const express = require('express')
const PORT = process.env.PORT || 9000 

require('./configs/connection')
const gapFinder = require('./tools/gapFinder')

let app = express()
app.use(cors())

app.listen(PORT, () => {

    console.log("Deal Breaker 2.0 by Amir Burdini is live on " + PORT)
})

setInterval(gapFinder.snapshot, 30 * 1000)