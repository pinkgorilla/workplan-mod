var should = require('should');
var moment = require('moment');
var data = require('../../data');

var manager;
var signedInUser;
var createdData;

before('#00. Preparation', function (done) {
    Promise.all([
        data.getSignedInUser(),
        data.getPeriodManager()
    ])
        .then(results => {
            signedInUser = results[0];
            manager = results[1];
            done();
        })
        .catch(e => done(e));
});


it('#01. Should success with normal data', function (done) {
    data.getNewPeriod()
        .then(period => {
            manager.create(period)
                .then(data => {
                    createdData = data;
                    createdData.should.have.property('_id');
                    createdData._id.should.be.instanceOf(Object);
                    createdData.from.should.be.instanceOf(Date);
                    createdData.to.should.be.instanceOf(Date);
                    done();
                })
                .catch(e => done(e));
        })
        .catch(e => done(e));
})

it('#02. Should fail with when create overlaping time range', function (done) {

    data.getNewPeriod()
        .then(overlap => {
            overlap.from.setDate(overlap.from.getDate() - 7);
            manager.create(overlap)
                .then(data => {
                    throw "should fail";
                })
                .catch(e => {
                    done();
                });
        })
})

it('#03. Should success when get account by id', function (done) {
    manager.getByQuery({ _id: createdData._id })
        .then(period => {
            period.should.have.property('_id');
            done();
        })
        .catch(e => done(e));
})