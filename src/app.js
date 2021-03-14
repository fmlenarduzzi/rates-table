const Hapi = require('@hapi/hapi');
const http = require('http');
require('./database');
const Rate = require('./models/Rate');
const Currency = require('./models/Currency');
const currencies = require('./currencies');

const API_KEY = "ffcc344a3f31700c0020d166fd17ea96";

async function calculateRate(from, to, fee) {
    var res = {};
    let originalRate;
    let feeAmount;
    let rateWithFee;

    if (from === currencies.EUR) {
        const toRate = await Currency.findOne({name: to});
        console.log('toRate = ' + toRate);
        originalRate = toRate.price;
    } else {
        const fromPrice = await Currency.findOne({name: from});
        const toPrice = await Currency.findOne({name: to});
        originalRate = toPrice.price / fromPrice.price;
    }

    feeAmount = fee > 0? originalRate * (1 / fee) : 0;
    rateWithFee = originalRate + feeAmount;
    res = {
        "Pair" : from + '-' + to,
        "Original Rate" : originalRate,
        "Fee %" : fee,
        "Fee Amount" : feeAmount,
        "Rate with fee applied" : rateWithFee
    }
    return res;
}

async function updatePrices() {
    await http.get('http://data.fixer.io/api/latest?access_key=' + API_KEY, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end',  () => {
            const ratesList = JSON.parse(data).rates;
            Object.keys(ratesList).forEach(async function(key) {
                const query = {name: key},
                    update = {price: ratesList[key]},
                    options = { upsert: true, new: true, setDefaultsOnInsert: true };
                await Currency.findOneAndUpdate(query, update, options);
            });
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/rates',
        handler: async (request, h) => {
            // Update DB prices before calculate FX rates
            await updatePrices();
            let result = [];
            // Gets existing rates from DB
            const rates = await Rate.find();
            // calculate response for each rate based on updated prices.
            for (const rate of rates) {
                const fxRate = await calculateRate(rate.from, rate.to, rate.feePercentage);
                result.push(fxRate);
            }
            return h.response(result);
        }
    }) // end of server.route

    server.route({
        method: 'GET',
        path: '/rates/{from}/{to}',
        handler: async (request, h) => {
            const foundRates = await Rate.find({from: request.params.from, to: request.params.to});
            return h.response(foundRates);
        }
    }) // end of server.route

    server.route({
        method: 'POST',
        path: '/rates',
        handler: async (request, h) => {
            try {
                const rate = new Rate(request.payload)
                const rateSaved = await rate.save();
                return h.response(rateSaved);
            } catch (error) {
                console.log(error.message);
                let errorMsg = '';
                if (error.message.includes('is not a valid enum value')) {
                    errorMsg = "Invalid Data";
                } else if (error.message.includes('duplicate key error collection')){
                    errorMsg = 'Rate already existed.';
                } else {
                    errorMsg = error;
                }
                return h.response(errorMsg).code(500);
            }
        }
    }) // end of server.route

    await server.start();
    // Update DB prices before calculate FX rates
    await updatePrices();
    console.log('Server running on %s', server.info.uri);
};

init();

