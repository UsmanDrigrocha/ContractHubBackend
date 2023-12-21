const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    folderOwner:[{
        type:mongoose.Schema.Types.ObjectId,
        role:{type:String }
    }],
    documents:[{
        type:String,
        default:null
    }]
}, { timestamps: true });


module.exports = mongoose.model('Folders', folderSchema);