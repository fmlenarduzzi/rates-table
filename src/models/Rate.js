const currencies = require('../currencies');
const { Schema, model } = require('mongoose');
const rateSchema = new Schema({
    from: {
        type: String,
        required: true,
        enum: Object.keys(currencies).map((key) => currencies[key])
    },
    to: {
        type: String,
        required: true,
        enum: Object.keys(currencies).map((key) => currencies[key])
    },
    feePercentage: {
        type: Number,
        required: false,
    },
})

rateSchema.index({ from: 1, to: 1 }, {
    unique: true,
});

module.exports = model('Rate', rateSchema);