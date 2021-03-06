const { Schema, model } = require('mongoose');
const pairSchema = new Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true
    },
    feePercentage: {
        type: Number
    },
})

module.exports = model('Pair', pairSchema);