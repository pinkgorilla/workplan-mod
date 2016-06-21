var should = require('should');
var request = require('supertest');
var shared = require('../../shared');
var data = require('../../data');

var WorkplanModels = require('workplan-models');
var UserWorkplan = WorkplanModels.UserWorkplan;
var UserWorkplanItem = WorkplanModels.UserWorkplanItem;

var db;
var url = shared.config.server.host + ':' + shared.config.server.port;
var token;
var actor;
var workplan;

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
        .get('/workplans')
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

it('#02. Should be able to get data', function (done) {
    data.getLatestPeriod()
        .then(period => {
            request(url)
                .get('/workplans/' + period.month + '/' + period.period)
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
                        workplan = result.data;

                        workplan.should.have.property('_id');
                        workplan.should.have.property('period');
                        workplan.should.have.property('user');
                        workplan.should.have.property('items');

                        workplan.period.should.be.instanceOf(Object);
                        workplan.user.should.be.instanceOf(Object);
                        workplan.items.should.be.instanceOf(Array);
                        done();
                    }
                });
        })
        .catch(e => {
            done(e);
        });
})

it('#03. Should be able to update workplan data', function (done) {
    data.getLatestPeriod()
        .then(period => {
            request(url)
                .get('/workplans/' + period.month + '/' + period.period)
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
                        workplan = result.data;
                        workplan.items.push(new UserWorkplanItem({ type: "Project", name: "ITEM 03", description: "DESC 03", estimatedDate: workplan.period.to, completedDate: workplan.period.to }))
                        workplan.items.push(new UserWorkplanItem({ type: "Project", name: "ITEM 04", description: "DESC 04", estimatedDate: workplan.period.to, completedDate: workplan.period.to }))

                        request(url)
                            .put('/workplans/' + period.month + '/' + period.period)
                            .set('Authorization', 'JWT ' + token)
                            .send(workplan)
                            .expect(200)
                            .end(function (err, response) {

                                if (err)
                                    done(err);
                                else {
                                    request(url)
                                        .get('/workplans/' + period.month + '/' + period.period)
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
                                                var updatedWorkplan = result.data;
                                                updatedWorkplan.should.have.property('_id');
                                                updatedWorkplan.should.have.property('period');
                                                updatedWorkplan.should.have.property('user');
                                                updatedWorkplan.should.have.property('items');

                                                updatedWorkplan.period.should.be.instanceOf(Object);
                                                updatedWorkplan.user.should.be.instanceOf(Object);
                                                updatedWorkplan.items.should.be.instanceOf(Array);
                                                done();
                                            }
                                        });
                                }
                            });
                    }
                });
        })
        .catch(e => {
            done(e);
        });
})