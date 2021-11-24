const axios = require('axios')

let MongoClient = require('mongodb').MongoClient;
let url = "mongodb+srv://AnomalyAdmin:theGap@cluster0.rzqlk.mongodb.net/Anomaly-DB?retryWrites=true&w=majority"

let fetchLastdayTrades = () => {

    let BTC_Info
    let ETH_Info
    let LTC_Info

    axios.get('https://bit2c.co.il/Exchanges/BtcNis/lasttrades').then(async(resp) => {

        let source = await resp.data;
        let volume = 0
        let amount = 0
    
        source.forEach((deal) => {
    
            if (deal.isBid) {
                amount += deal.amount
                volume += deal.amount * deal.price
            }
            
        })
    
        console.log()
        console.log("this is the number of deals in the last 24h : " + source.length)
        console.log("this is the amount of BTC swapped : " + amount)
        console.log("this is how many ILS we need in 24h : " + volume)
        console.log()


        BTC_Info = {
            "numOfTrades" : source.length,
            "volume" : amount,
            "volume_fiat" : volume,
            "time" : Date.now(),
            "asset" : "BTC"
        }

    })
    
    axios.get('https://bit2c.co.il/Exchanges/LtcNis/lasttrades').then(async(resp) => {
    
        let source = await resp.data;
        let volume = 0
        let amount = 0
    
        source.forEach((deal) => {
    
            if (deal.isBid) {
                amount += deal.amount
                volume += deal.amount * deal.price
            }
            
        })
        
        console.log()
        console.log("this is the number of deals in the last 24h : " + source.length)
        console.log("this is the amount of Ltc swapped : " + amount)
        console.log("this is how many ILS we need in 24h : " + volume)
        console.log()

        LTC_Info = {
            "numOfTrades" : source.length,
            "volume" : amount,
            "volume_fiat" : volume,
            "time" : Date.now(),
            "asset" : "LTC"
        }

    })
    
    axios.get('https://bit2c.co.il/Exchanges/EthNis/lasttrades').then(async(resp) => {
    
        let source = await resp.data;
        let volume = 0
        let amount = 0
    
        source.forEach((deal) => {
    
            if (deal.isBid) {
                amount += deal.amount
                volume += deal.amount * deal.price
            }
            
        })
        
        console.log()
        console.log("this is the number of deals in the last 24h : " + source.length)
        console.log("this is the amount of Eth swapped : " + amount)
        console.log("this is how many ILS we need in 24h : " + volume)
        console.log()

        ETH_Info = {
            "numOfTrades" : source.length,
            "volume" : amount,
            "volume_fiat" : volume,
            "time" : Date.now(),
            "asset" : "ETH"
        }

    })
    
    MongoClient.connect(url, function(err, db) {
        if (err) throw err
        let DB = db.db("Anomaly-DB")
  
        DB.collection("trades").insertOne(BTC_Info, function(err, res) {
          if (err) throw err
          db.close()
        })

        
    })

    MongoClient.connect(url, function(err, db) {
        if (err) throw err
        let DB = db.db("Anomaly-DB")
  
        DB.collection("trades").insertOne(ETH_Info, function(err, res) {
          if (err) throw err
          db.close()
        })

        
    })

    MongoClient.connect(url, function(err, db) {
        if (err) throw err
        let DB = db.db("Anomaly-DB")
  
        DB.collection("trades").insertOne(LTC_Info, function(err, res) {
          if (err) throw err
          db.close()
        })

        
    })

}

module.exports = {fetchLastdayTrades}     