let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
const Rate = require('../src/models/Rate');
const Currency = require('../src/models/Currency');
const app = require("../src/app");

chai.use(chaiHttp);
const url= 'http://localhost:3000';

describe('Test Rates API ',()=>{

    before(async () => {
        await Rate.remove({});
        await app.setupApp();
    });

    describe('Test Rates Creation ',()=> {

        before(async () => {
            await Rate.remove({});
        });

        it('should create a fx rate with fee', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "USD",
                    feePercentage: "10"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(200);
                    expect(res.body.from).to.equals('EUR');
                    expect(res.body.to).to.equals('USD');
                    expect(res.body.feePercentage).to.equals(10);
                    done();
                });
        });

        it('should create a fx rate without fee', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "ARS"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(200);
                    expect(res.body.from).to.equals('EUR');
                    expect(res.body).to.not.have.property('feePercentage');
                    done();
                });
        });

        it('should create a fx rate with non-direct conversion', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "USD",
                    to: "ARS",
                    feePercentage: "10"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(200);
                    expect(res.body.from).to.equals('USD');
                    expect(res.body.to).to.equals('ARS');
                    expect(res.body.feePercentage).to.equals(10);
                    done();
                });
        });

        it('should create a fx rate with EUR as destination', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "USD",
                    to: "EUR",
                    feePercentage: "5"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(200);
                    expect(res.body.from).to.equals('USD');
                    expect(res.body.to).to.equals('EUR');
                    expect(res.body.feePercentage).to.equals(5);
                    done();
                });
        });

        it('should fail when fx rate is created with unsupported currencies', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "AAA",
                    to: "USD",
                    feePercentage: "50"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(500);
                    expect(res.text).to.equals('Invalid Data');
                    done();
                });
        });

        it('should fail when fx rate is created with wrong fee', (done) => {
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "USD",
                    feePercentage: "textNotNumber"
                })
                .end(function (err, res) {
                    console.log(res.body);
                    expect(res).to.have.status(500);
                    expect(res.text).to.equals('Invalid Data');
                    done();
                });
        });
    }); // End Describe for Creation Tests

    describe('Test for Rate Queries ',()=>{

        it('should update and return all currencies prices',  () => {
            chai.request(url)
                .get('/prices')
                .end(   async function(err,res){
                    expect(res.body.length).to.equals(168);
                    res.body.result.forEach ((item) => {
                        expect(item).to.have.property('name');
                        expect(item).to.have.property('price');
                    });
                });
        });

        it('should get all created rates',  async () => {
            await Rate.remove({});

            // Adds three rates
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "USD",
                    feePercentage: 10
                })
                .end(function (err, res) {});

            chai.request(url)
                .post('/rates')
                .send({
                    from: "USD",
                    to: "ARS",
                    feePercentage: 50
                })
                .end(function (err, res) {});

            chai.request(url)
                .post('/rates')
                .send({
                    from: "USD",
                    to: "BRL"
                })
                .end(function (err, res) {});

            chai.request(url)
                .get('/rates')
                .end(   async function(err,res){
                    expect(res.body.length).to.equals(3);
                    res.body.result.forEach ((item) => {
                        expect(item).to.have.property('Pair');
                        expect(item).to.have.property('Original Rate');
                        expect(item).to.have.property('Fee %');
                        expect(item).to.have.property('Rate with fee applied');
                    });
                });
        });

        it('should get all correct fields',  async () => {
            await Rate.remove({});

            // Adds one rate
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "USD",
                    feePercentage: 10,
                })
                .end(function (err, res) {});

            // Checks rate calculation
            chai.request(url)
                .get('/rates')
                .end(   async function(err,res){
                    const rate = res.body[0];
                    const originalRate = rate['Original Rate'];
                    const feeAmount = rate['Fee Amount'];
                    console.log(rate);
                    expect(res.body.length).to.equals(1);
                    expect(rate.Pair).to.equals('EUR-USD');
                    expect(rate).to.have.property('Original Rate');
                    expect(rate['Fee %']).to.equals('10');
                    expect(rate).to.have.property('Fee Amount');
                    expect(rate['Fee Amount']).to.equals(feeAmount);
                    expect(rate).to.have.property('Rate with fee applied');
                    expect(rate['Rate with fee applied']).to.equals(originalRate + feeAmount);
                });
        });

        it('should get all correct fields',  async () => {
            await Rate.remove({});

            // Adds one rate
            chai.request(url)
                .post('/rates')
                .send({
                    from: "EUR",
                    to: "USD",
                    feePercentage: 10,
                })
                .end(function (err, res) {});

            // Checks rate calculation
            chai.request(url)
                .get('/rates/EUR/USD')
                .end(   async function(err,res){
                    const rate = res.body[0];
                    const originalRate = rate['Original Rate'];
                    const feeAmount = rate['Fee Amount'];
                    console.log(rate);
                    expect(res.body.length).to.equals(1);
                    expect(rate.Pair).to.equals('EUR-USD');
                    expect(rate).to.have.property('Original Rate');
                    expect(rate['Fee %']).to.equals('10');
                    expect(rate).to.have.property('Fee Amount');
                    expect(rate['Fee Amount']).to.equals(feeAmount);
                    expect(rate).to.have.property('Rate with fee applied');
                    expect(rate['Rate with fee applied']).to.equals(originalRate + feeAmount);
                });
        });
    });
});

// DB Scenarios

describe('Test DB Operations ',async ()=>{

    beforeEach(async () => {
        await Rate.remove({});
    });

    it('should create a fx rate successfully', async () => {
        const rate1 = {
            from: 'EUR',
            to : 'USD',
            feePercentage: '10'
        };
        await Rate.create(rate1);
        const rates = await Rate.find({});

        expect(rates.length).to.equals(1);
        expect(rates[0].from).to.equals('EUR');
        expect(rates[0].to).to.equals('USD');
        expect(rates[0].feePercentage).to.equals(10);
    });

    it('should avoid duplicated fx rates', async () => {
        const rate1 = {
            from: 'EUR',
            to : 'USD',
            feePercentage: '10'
        };
        await Rate.create(rate1);
        let rates = await Rate.find({});

        expect(rates.length).to.equals(1);
        expect(rates[0].from).to.equals('EUR');
        expect(rates[0].to).to.equals('USD');
        expect(rates[0].feePercentage).to.equals(10);

        // Trying to create same object twice.
        try {
            await Rate.create(rate1);
        } catch (error) {
            expect(error.message).to.equals('E11000 duplicate key error collection: ratesTable.rates index: from_1_to_1 dup key: { : "EUR", : "USD" }');
        }

        rates = await Rate.find({});
        expect(rates.length).to.equals(1);
        expect(rates[0].from).to.equals('EUR');
        expect(rates[0].to).to.equals('USD');
        expect(rates[0].feePercentage).to.equals(10);
    });
});
