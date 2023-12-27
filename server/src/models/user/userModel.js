const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // number: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    companyStatus: { type: mongoose.Schema.Types.ObjectId, ref: "Companies", default: null },
    // otp: {
    //     code: { type: String, default: null },
    //     createdAt: { type: Date, default: null },
    //     expiredAt: { type: Date, default: null }
    // },
    role: { type: String, default: "user" },
    firstVisit: { type: Boolean, default: false },
    tokenVersion: { type: String, default: null }
}, { timestamps: true });


module.exports = mongoose.model('Users', userSchema);