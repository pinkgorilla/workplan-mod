var should = require('should');
var moment = require('moment');
var shared = require('../../shared');
var data = require('../../data');

var WorkplanModels = require('workplan-models');
var UserWorkplan = WorkplanModels.UserWorkplan;
var UserWorkplanItem = WorkplanModels.UserWorkplanItem;

var manager;
var signedInUser;

var createdData;
var overlap = {};

before('#00. Preparation', function (done) {
    Promise.all([
        data.getSignedInUser(),
        data.getUserWorkplanManager()
    ])
        .then(results => {
            signedInUser = results[0];
            manager = results[1];
            done();
        })
        .catch(e => done(e));
});

function checkDataIntegrity(workplan) {
    workplan.should.have.property('_id');
    workplan.should.have.property('period');
    workplan.should.have.property('user');
    workplan.should.have.property('items');

    workplan._id.should.be.instanceOf(Object);
    workplan.period.should.be.instanceOf(Object);
    workplan.user.should.be.instanceOf(Object);
    workplan.items.should.be.instanceOf(Array);

    workplan.period.from.should.be.instanceOf(Date);
    workplan.period.to.should.be.instanceOf(Date);

    for (var item of workplan.items) {
        item.estimatedDate.should.be.instanceOf(Date);
        item.completedDate.should.be.instanceOf(Date);
    }
}

it('#01. Get user workplan by period', function (done) {
    data.getLatestPeriod()
        .then(period => {
            manager.get(signedInUser, period.month, period.period)
                .then(workplan => {
                    createdData = workplan;
                    checkDataIntegrity(createdData);
                    done();
                })
                .catch(e => done(e));
        })
})

it('#02. Add workplan item to user workplan', function (done) {
    data.getLatestPeriod()
        .then(period => {
            manager.get(signedInUser, period.month, period.period)
                .then(workplan => {
                    workplan.items.push(new UserWorkplanItem({ type: "Project", name: "ITEM 01", description: "DESC 01", estimatedDate: workplan.period.to, completedDate: workplan.period.to }))
                    workplan.items.push(new UserWorkplanItem({ type: "Project", name: "ITEM 02", description: "DESC 02", estimatedDate: workplan.period.to, done: true, completedDate: workplan.period.to }))
                    manager.update(signedInUser, workplan)
                        .then(updatedWorkplanId => {

                            manager.get(signedInUser, period.month, period.period)
                                .then(updatedWorkplan => {
                                    checkDataIntegrity(updatedWorkplan);
                                    updatedWorkplan.completion.should.equal(50, "completion invalid");
                                    done();
                                })
                                .catch(e => done(e));
                        })
                        .catch(e => done(e));
                })
                .catch(e => done(e));
        })
})

it('#03. Update workplan item to user workplan', function (done) {
    data.getLatestPeriod()
        .then(period => {
            manager.get(signedInUser, period.month, period.period)
                .then(workplan => {
                    var item = workplan.items[0];
                    item.done = true;
                    item.name = item.name + '-[updated]';
                    item.description = item.description + '-[updated]';

                    manager.updateItem(signedInUser, period.month, period.period, item)
                        .then(updatedWorkplanId => { 
                            manager.get(signedInUser, period.month, period.period)
                                .then(updatedWorkplan => {
                                    checkDataIntegrity(updatedWorkplan);
                                    updatedWorkplan.completion.should.equal(100, "completion invalid");
                                    done();
                                })
                                .catch(e => done(e)); 
                        })
                        .catch(e => done(e));
                })
                .catch(e => done(e));
        })
})

it('#04. Get workplan insight', function (done) {
    data.getLatestPeriod()
        .then(period => {
            manager.insight(signedInUser, period.month, period.period)
                // manager.insight(signedInUser)
                .then(workplan => {
                    checkDataIntegrity(workplan);
                    done();
                })
                .catch(e => done(e));
        })
})