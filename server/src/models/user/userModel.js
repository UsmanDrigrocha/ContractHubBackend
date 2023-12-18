const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // number: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    // otp: {
    //     code: { type: String, default: null },
    //     createdAt: { type: Date, default: null },
    //     expiredAt: { type: Date, default: null }
    // },
    tokenVersion: { type: String, default: null }
}, { timestamps: true });


module.exports = mongoose.model('Users', userSchema);