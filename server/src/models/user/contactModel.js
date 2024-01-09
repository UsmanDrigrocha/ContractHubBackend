const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    contacts: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String, default: null },
        streetAddress: {
            type: String, default: null
        },
        city: { type: String, default: null },
        state: { type: String, default: null },
        zip: { type: String, default: null },
        country: { type: String, default: null }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Contacts', contactSchema);
