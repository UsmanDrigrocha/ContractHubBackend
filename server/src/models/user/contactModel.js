const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    contacts: [{
       name:{type:String},
       email:{type:String}
    }],
}, { timestamps: true });

module.exports = mongoose.model('Contacts', contactSchema);
