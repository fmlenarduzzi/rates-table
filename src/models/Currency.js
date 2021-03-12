const currencies = require('../currencies');
const { Schema, model } = require('mongoose');
const currencySchema = new Schema({
    name: {
        type: String,
        required: true,
        enum: Object.keys(currencies).map((key) => currencies[key])
    },
    price: {
        type: Number,
        required: true,
    },
}, { timestamps: true })

currencySchema.index({ name: 1}, {
    unique: true,
});

module.exports = model('Currency', currencySchema);