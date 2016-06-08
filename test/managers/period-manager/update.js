var should = require('should');
var data = require('../../data');

var manager;
var signedInUser;
var dataId;
var dataToBeUpdated;

before('#00. Initialize', function (done) {
    Promise.all([
        data.getSignedInUser(),
        data.getPeriodManager(),
        data.getLatestPeriod()
    ])
        .then(results => {
            signedInUser = results[0];
            manager = results[1];
            dataToBeUpdated = results[2];
            dataId = dataToBeUpdated._id;
            done();
        })
        .catch(e => done(e));
});


it('#01. Should success when update data', function (done) {
    manager.getByQuery({ _id: dataId })
        .then(data => {
            should.exist(data);
            // update data.
            dataToBeUpdated = data;

            manager.update(dataToBeUpdated)
                .then(updatedData => {
                    should.notEqual(dataToBeUpdated._stamp, updatedData._stamp, "_stamp must not match.");
                    updatedData._id.should.be.instanceOf(Object);
                    updatedData.from.should.be.instanceOf(Date);
                    updatedData.to.should.be.instanceOf(Date);
                    done();
                })
                .catch(e => done(e));
        })
        .catch(e => done(e));
});

it('#02. Should fail when update with outdated _stamp', function (done) {
    manager.update(dataToBeUpdated)
        .then(updatedData => {
            should.fail('no error was thrown when it should have been')
            done();
        })
        .catch(e => done());
}); 