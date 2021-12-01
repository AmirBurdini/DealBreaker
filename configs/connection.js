const mongoose = require('mongoose')

mongoose.connect(`mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.rzqlk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,{
    
    useNewUrlParser:true,
    useUnifiedTopology:true
})