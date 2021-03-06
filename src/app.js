const Hapi = require('@hapi/hapi');
const http = require('http');
require('./database');
const Rate = require('./models/Rate')

const API_KEY = "ffcc344a3f31700c0020d166fd17ea96";

function populateDB() {
    http.get('http://data.fixer.io/api/latest?access_key=' + API_KEY, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end',  () => {
            const ratesList = JSON.parse(data).rates;
            Object.keys(ratesList).forEach(async function(key) {
                const query = {rate: key},
                    update = {price: ratesList[key]},
                    options = { upsert: true, new: true, setDefaultsOnInsert: true };
                await Rate.findOneAndUpdate(query, update, options);
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
            const rates = await Rate.find();
            return h.response(rates);
        }
    }) // end of server.route

    server.route({
        method: 'GET',
        path: '/rates/{rate}',
        handler: async (request, h) => {
            const foundRate = await Rate.find({rate: request.params.rate});
            return h.response(foundRate);
        }
    }) // end of server.route

    server.route({
        method: 'POST',
        path: '/pair',
        handler: async (request, h) => {

        }
    }) // end of server.route

    await server.start();
    console.log('Server running on %s', server.info.uri);
    populateDB();
};

init();

