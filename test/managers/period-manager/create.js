var should = require('should');
var shared = require('../../shared');

var db;
var manager;

var date = new Date();
var code = date.getTime().toString(16);
var inputData = shared.newUser();
var lastPeriod;

before('connect to db', function (done) {
    var factory = require('mongo-factory');
    factory.getConnection(shared.config.connectionString)
        .then(dbInstance => {
            db = dbInstance;
            var PeriodManager = require('../../../src/managers/period-manager');
            manager = new PeriodManager(db, shared.user);
            manager.periodCollection.find().sort({ _id: -1 }).limit(1).next()
                .then(period => {
                    lastPeriod = period;
                    done();
                })
                .catch(e => done(e));
        })
        .catch(e => done(e));
});


it('should success with normal data', function (done) {
    manager.create(inputData)
        .then(data => {
            createdData = data;
            createdData.should.have.property('_id');
            done();
        })
        .catch(e => done(e));
})

it('should fail with when create duplicate data', function () {
    manager.create(inputData)
        .then(data => {
            throw "should fail";
        })
        .catch(e => {
            done();
        });
})

it('should success when get account by id', function (done) {
    manager.getAccountByQuery({ _id: createdData._id })
        .then(account => {
            account.should.have.property('_id');
            done();
        })
        .catch(e => done(e));
})

it('should success when get profile by accountId', function (done) {
    manager.getProfileByQuery({ accountId: createdData._id })
        .then(profile => {
            profile.should.have.property('_id');
            done();
        })
        .catch(e => done(e));
})

it('should success when get info by accountId', function (done) {
    manager.getInfoByQuery({ accountId: createdData._id })
        .then(info => {
            info.should.have.property('_id');
            done();
        })
        .catch(e => done(e));
});