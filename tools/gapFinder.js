const axios = require('axios')

// twilio SMS services
const twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
 
// mongo api
let MongoClient = require('mongodb').MongoClient
let url = "mongodb+srv://AnomalyAdmin:z8mOVXSZupRWkrqy@cluster0.rzqlk.mongodb.net/Anomaly-DB?retryWrites=true&w=majority"

// api info
const bit2c = require('bit2c')
const Binance = require('binance-api-node').default
const client = Binance()

let USD_ILS = 3.11

// get USD/ILS rate
axios.get('http://api.exchangeratesapi.io/v1/latest?access_key=2ba37bbd6480b801d3973df6c84d2d45&symbols=ILS,USD').then(async(resp) => {

   let data = resp.data
   USD_ILS = data.rates.ILS / data.rates.USD

   console.log(USD_ILS)
})

// Trade fees in Bit2c
const BIT2C_FEES = 0.99

// Trade fees in Binance
const BINANCE_FEES = 1.001

// prevent multiple SMS 
let Sendit = true

let findOverLap = async(bids, asks, asset) => {

   // indexes
   let bid_Num = 0
   let ask_Num = 0

   // Calculate Trade Volume Needed
   let Fiat_Volume = 0

   // price after fees
   let low_Bid = (bids[bid_Num][0] * BIT2C_FEES)
   let high_Ask = (asks[ask_Num].price * USD_ILS / BINANCE_FEES)

   // amount of Fiat money
   let Fiat_Amount = 0

   BIT2C_BTC_AMOUNT = 0
   BIT2C_PRICELIMIT = 0
   BTC_balance = 0
   Fiat_balance = 0

   let Precentage = 0 

   // as long as its profitable
   while (low_Bid > high_Ask && ask_Num < 99 && bid_Num < 99) {

      console.log(Fiat_Volume)
      // the amount of bid is smaller than amount of ask?
      // buy the amount specified on the sold order
      if (bids[bid_Num][1] < asks[ask_Num].quantity) {

         Fiat_Volume =  Fiat_Volume + bids[bid_Num][1] * high_Ask

         asks[ask_Num].quantity = asks[ask_Num].quantity - bids[bid_Num][1]
         Fiat_Amount = Fiat_Amount + bids[bid_Num][1] * (low_Bid - high_Ask)

         bid_Num++

      } else if (bids[bid_Num][1] > asks[ask_Num].quantity) {

         Fiat_Volume =  Fiat_Volume + asks[ask_Num].quantity * high_Ask

         bids[bid_Num][1] = bids[bid_Num][1] - asks[ask_Num].quantity
         Fiat_Amount = Fiat_Amount + asks[ask_Num].quantity * (low_Bid - high_Ask)

         ask_Num++

      } else {

         Fiat_Volume =  Fiat_Volume + asks[ask_Num].quantity * high_Ask
         
         Fiat_Amount = Fiat_Amount + asks[ask_Num].quantity * (low_Bid - high_Ask)

         bid_Num++
         ask_Num++
      }

      // the position opened with this bid-ask duo
      console.log("bid : { price : " + Number(low_Bid).toFixed(4) + " , quantity : " + Number(bids[bid_Num][1]).toFixed(5) + " , depth : " + bid_Num + " }")
      console.log("ask : { price : " + Number(high_Ask).toFixed(4) + " , quantity : " + Number(asks[ask_Num].quantity).toFixed(5) + " , depth : " + ask_Num + " }")
      console.log('--------------------------------------------------------------')

      low_Bid = (bids[bid_Num][0] * BIT2C_FEES)
      high_Ask = (asks[ask_Num].price * USD_ILS / BINANCE_FEES)
   }

   Precentage = (Fiat_Amount)/(Fiat_Volume)

   if (Number(Fiat_Volume) === 0) {

      console.log("Negative or Zero Gap Detected \n")

      MongoClient.connect(url, function(err, db) {
         if (err) throw err
         let DB = db.db("Anomaly-DB")
   
         let Spread = {
            time : Date.now(),
            precentage : 0,
            // quanitfy spread in precentage
            asset : asset,
            volumeILS : Number(Fiat_Volume).toFixed(2),
            gapILS : 0
         }

         DB.collection("orders").insertOne(Spread, function(err, res) {
           if (err) throw err
           db.close()
         })
       })

   } else {

      if ((Precentage * 100) > Number(process.env.DESIRED_PRECENTAGE) 
         && Number(Fiat_Amount) > Number(process.env.DESIRED_AMOUNT) && Sendit) {
          
         twilio.messages.create({ 
            body: `ATTENTION! a gap of ${(Precentage * 100).toFixed(3)} % was found worth ${Number(Fiat_Amount).toFixed(2)}`,  
            messagingServiceSid: 'MG430fddfcbfb290cadff378b7c575a0f3',      
            to: '+972524891251' 
         }).done()
         Sendit = false
      }


      console.log("the asset is :" + asset)
      console.log("there is a gap worth : " + Number(Fiat_Amount).toFixed(2) + " ILS \n")
      console.log("Trading Volume Of : " + Number(Fiat_Volume).toFixed(2) + " ILS \n")
      console.log((Precentage * 100).toFixed(3) + " % \n")

      MongoClient.connect(url, function(err, db) {
         if (err) throw err
         let DB = db.db("Anomaly-DB")
   
         let Spread = {
            time : Date.now(),
            precentage : (Precentage * 100).toFixed(3),
            // quanitfy spread in precentage
            asset : asset,
            volumeILS : Number(Fiat_Volume).toFixed(2),
            gapILS : Number(Fiat_Amount).toFixed(2)
         }

         DB.collection("orders").insertOne(Spread, function(err, res) {
           if (err) throw err
           db.close()
         })
       })
   }
}

let fetchOrderBooks = () => {

   bit2c.getOrderBook('BtcNis',(error, resp_bit2c) => {

      client.book({ symbol: 'BTCBUSD' }).then((resp_binance) => {
   
         findOverLap(resp_bit2c.bids, resp_binance.asks, "BTC")
      })
   })

   bit2c.getOrderBook('EthNis',(error, resp_bit2c) => {

      client.book({ symbol: 'ETHBUSD' }).then((resp_binance) => {
   
         findOverLap(resp_bit2c.bids, resp_binance.asks, "ETH")
      })
   })

   bit2c.getOrderBook('LtcNis',(error, resp_bit2c) => {

      client.book({ symbol: 'LTCBUSD' }).then((resp_binance) => {
   
         findOverLap(resp_bit2c.bids, resp_binance.asks, "LTC")
      })
   })
}

module.exports = {fetchOrderBooks}