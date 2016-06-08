var should = require('should');
var request = require('supertest');
var shared = require('../../shared');
var data = require('../../data');

var db;
var url = shared.config.server.host + ':' + shared.config.server.port;
var token;
var actor;
var createdData;

before('#00. Authenticate', function (done) {
    data.getSignedInUser()
        .then(signedInUser => {
            request(url)
                .post('/authenticate')
                .send({ username: signedInUser.username, password: 'Standar123' })
                .expect(200)
                .end(function (err, response) {
                    if (err)
                        done(err);
                    else {
                        var result = response.body;
                        token = result.data.token;
                        actor = result.data.user;
                        done();
                    }
                });
        })
        .catch(e => {
            done(e);
        });
});

it('#01. Should be able to get list', function (done) {
    request(url)
        .get('/periods')
        .set('Authorization', 'JWT ' + token)
        .expect(200)
        .end(function (err, response) {
            if (err)
                done(err);
            else {
                var result = response.body;
                should.notEqual(result.apiVersion, "0.0.0", "api version not set");
                result.should.have.property('data');
                result.data.should.instanceOf(Array);
                done();
            }
        });
})

it('#02. Should be able to create data', function (done) {
    data.getNewPeriod()
        .then(newPeriod => {
            request(url)
                .post('/periods')
                .set('Authorization', 'JWT ' + token)
                .send(newPeriod)
                .expect(200)
                .end(function (err, response) {
                    if (err)
                        done(err);
                    else {
                        var result = response.body;
                        should.notEqual(result.apiVersion, "0.0.0", "api version not set");
                        result.should.have.property('data');
                        result.data.should.not.instanceOf(Array);
                        createdData = result.data;
                        createdData.month.should.be.equal(newPeriod.month);
                        createdData.period.should.be.equal(newPeriod.period);
                        createdData._createdBy.should.be.equal(actor.username);
                        createdData._updatedBy.should.be.equal(actor.username);
                        done();
                    }
                });
        })
        .catch(e => {
            done(e);
        });
})

it('#03. Should be able to get created data', function (done) {
    request(url)
        .get('/periods/' + createdData.month + '/' + createdData.period)
        .set('Authorization', 'JWT ' + token)
        .expect(200)
        .end(function (err, response) {
            if (err)
                done(err);
            else {
                var result = response.body;
                should.notEqual(result.apiVersion, "0.0.0", "api version not set");
                result.should.have.property('data');
                result.data.should.not.instanceOf(Array);
                result.data.month.should.be.equal(createdData.month);
                result.data.period.should.be.equal(createdData.period);
                done();
            }
        });
})

it('#04. Should be able to update created data', function (done) {

    var dataToBeUpdated = createdData;

    request(url)
        .put('/periods/' + createdData.month + '/' + createdData.period)
        .set('Authorization', 'JWT ' + token)
        .send(dataToBeUpdated)
        .expect(200)
        .end(function (err, response) {
            if (err)
                done(err);
            else {
                var result = response.body;
                should.notEqual(result.apiVersion, "0.0.0", "api version not set");
                result.should.have.property('data');
                result.data.should.not.instanceOf(Array);
                var updatedData = result.data;
                should.equal(dataToBeUpdated.month, updatedData.month, "month not match.");
                should.equal(dataToBeUpdated.period, updatedData.period, "period not match.");
                should.notEqual(dataToBeUpdated._stamp, updatedData._stamp, "_stamp must not match.");
                done();
            }
        });
})