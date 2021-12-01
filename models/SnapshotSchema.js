const mongoose = require('mongoose');

const appSchema = mongoose.Schema;

const snapshotSchema = appSchema({

    id : String,
    time : Date,
    exchange : String,
    symbol : String,
    book : {asks : [[Array]], bids : [[Array]]},
    cc_rate : Number,
})

module.exports = mongoose.model('snapshots',snapshotSchema);