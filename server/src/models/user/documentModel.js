const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    docName: { type: String, required: true },
    docURL: { type: String, required: true },
    docOwner: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
    docFolder: { type: mongoose.Schema.Types.ObjectId, required: true },
    isSigned: { type: Boolean, required: true, default: false },
    status: {
        type: String,
        required: true,
        default: "pending",
        enum: ["pending", "completed"]
    },
    receiver: [{ type: String, required: true }],
    status:{type:String , dafault:"pending", enum:["pending", "completed","sent" ]}
}, { timestamps: true });

module.exports = mongoose.model('Documents', documentSchema);
