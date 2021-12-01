let Snapshot = require('./SnapshotSchema')

const getAll = () => {

    return new Promise((resolve, reject)=>{
        
        snapshot.find({},(err, data)=>{
            
            if(err){
                reject(err)
            } 
            else{
                resolve(data)
            }
        })

    })
}

const addSnapshot = (snapshot) => {

    return new Promise((resolve, reject)=> {

        let new_snapshot = new Snapshot({
            id : snapshot.id,
            time : snapshot.time,
            exchange : snapshot.exchange,
            symbol : snapshot.symbol,
            book : snapshot.book,
            cc_rate : snapshot.cc_rate,
        });

        new_snapshot.save((err)=>{
            if(err){
                reject(err)
            }
            else {
                resolve(new_snapshot)
            }
        })
    })
}

const deleteSnapshot = (id) => {

    return new Promise((resolve, reject)=>{
        snapshot.findByIdAndDelete(id,(err)=>{
            if(err){
                reject(err)
            }
            else {
                resolve("Removed Successfully")
            }
        })
    })
}

module.exports = {getAll, addSnapshot, deleteSnapshot};