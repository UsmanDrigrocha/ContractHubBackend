const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    tempName: { type: String, required: true },
    uploadedBy: { type:String, required: true },
    receiver: [{ type: String, required: true }],
    company:{type:String , default:''},
    docURL:{type:String , default:null},
}, { timestamps: true });

module.exports = mongoose.model('Templates', templateSchema);
