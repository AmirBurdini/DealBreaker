const ccxt = require('ccxt')
const currency = require('currency-converter-lt')

const snapshotmodel = require('../models/SnapshotModel')

// fetched current USD/ILS conversion rate
const getRate = async() => {

    let USD_ILS = new currency({from:"USD", to:"ILS", amount: 100});
    let rate = await USD_ILS.rates();
    return rate
}

// get the order book on the specified exchange with the given symbol
const fetchBooks = async(exchange, symbol) => {

    let book = await exchange.fetchOrderBook(symbol)

    let currency_rate = await getRate()
    let time = Date.now()

    let orderBook = {bids : book.bids, asks : book.asks}

    return {
        time : time,
        exchange : exchange.name,
        symbol : symbol,
        book : orderBook,
        cc_rate : currency_rate
    }
}

const snapshot = async() => {

    let binance = new ccxt.binance();
    let bit2c = new ccxt.bit2c();
    let ftx = new ccxt.ftx();

    let snapshot = []

    snapshot.push(await fetchBooks(binance, 'BTC/BUSD'))
    snapshot.push(await fetchBooks(binance, 'ETH/BUSD'))
    snapshot.push(await fetchBooks(binance, 'LTC/BUSD'))

    snapshot.push(await fetchBooks(ftx, 'BTC/USD'))
    snapshot.push(await fetchBooks(ftx, 'ETH/USD'))
    snapshot.push(await fetchBooks(ftx, 'LTC/USD'))

    snapshot.push(await fetchBooks(bit2c, 'BtcNis'))
    snapshot.push(await fetchBooks(bit2c, 'EthNis'))
    snapshot.push(await fetchBooks(bit2c, 'LtcNis'))  

    snapshot.forEach((snap) => {

        SaveData(snap)
    })
}

const SaveData = async(data) => {

    snapshotmodel.addSnapshot(data).catch((err) => console.log(err))
}

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

module.exports = {snapshot}