const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    compName: { type: String, required: true },
    compEmail: { type: String, required: true, unique: true },
    compTimzeZone: { type: String, default: null },
    companyForm: { type: String, default: null, },
    companyOwner: {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        role: { type: String, default: "Super Admin" }
    },
    team: [{ // optional
        userID: { type: mongoose.Schema.Types.ObjectId },
        role: [{ type: String, required: true }],
        title: { type: String, } // optional
    }],
    compAddress: {
        country: {
            type: String,
        },
        city: {
            type: String,
        },
        zip:
        {
            type: String,
        },
        state:
        {
            type: String,
        },
    },
    compPhone: { type: String }, // optional
    // optional
}, { timestamps: true });

module.exports = mongoose.model('Companies', userSchema);
