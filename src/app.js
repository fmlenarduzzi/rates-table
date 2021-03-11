const Hapi = require('@hapi/hapi');
const http = require('http');
require('./database');
const Rate = require('./models/Rate')

const API_KEY = "ffcc344a3f31700c0020d166fd17ea96";

async function calculateRate(from, to, fee) {
    const ratesList = await getFxRates();

    let originalRate;
    let feeAmount;
    let rateWithFee;

    if (from === 'EUR') {
        originalRate = ratesList[to];
        feeAmount = originalRate * (1 / fee);
        rateWithFee = originalRate + feeAmount;
    } else {

    }
    /*Object.keys(ratesList).forEach(async function(key) {
        const query = {rate: key},
            update = {price: ratesList[key]},
            options = { upsert: true, new: true, setDefaultsOnInsert: true };
        await Rate.findOneAndUpdate(query, update, options);
    }); */
    return {
        "Pair" : from+to,
        "Original Rate" : originalRate,
        "Fee %" : fee,
        "Fee Amount" : feeAmount,
        "Rate with fee applied" : rateWithFee
    }
}

async function getFxRates() {
    await http.get('http://data.fixer.io/api/latest?access_key=' + API_KEY, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end',  () => {
            return JSON.parse(data).rates;
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
            let result = [];
            const rates = await Rate.find();
            for (const rate of Object.keys(rates)) {
                console.log('rate = ' + rate );
                const fxRate = await calculateRate(rate.from, rate.to, rate.feePercentage);
                console.log('fxRate = ' + JSON.stringify(fxRate));
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
    console.log('Server running on %s', server.info.uri);
};

init();

