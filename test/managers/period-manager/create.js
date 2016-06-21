var should = require('should');
var moment = require('moment');
var data = require('../../data');

var manager;
var signedInUser;
var createdDataId;
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
                .then(id => {
                    createdDataId = id;
                    createdDataId.should.be.instanceOf(Object);
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

it('#03. Should success when get period by id', function (done) {
    manager.getByQuery({ _id: createdDataId })
        .then(period => {
            period.should.have.property('_id');
            createdData = period; 
            createdData.should.be.instanceOf(Object);
            createdData.should.have.property('_id');
            createdData.from.should.be.instanceOf(Date);
            createdData.to.should.be.instanceOf(Date);
            done();
        })
        .catch(e => done(e));
})