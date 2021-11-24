const axios = require('axios')


// get USD/ILS rate
axios.get('http://api.exchangeratesapi.io/v1/latest?access_key=2ba37bbd6480b801d3973df6c84d2d45&symbols=ILS,USD').then(async(resp) => {

   let data = resp.data
   USD_ILS = data.rates.ILS / data.rates.USD

   console.log(USD_ILS)
})