'use strict'

var Map = require('capital-models').map;
var ObjectId = require('mongodb').ObjectId;
var Manager = require('mean-toolkit').Manager;
var PeriodManager = require('./period-manager');
var moment = require('moment');
var UserWorkplan = require('capital-models').workplan.UserWorkplan;
var UserWorkplanItem = require('capital-models').workplan.UserWorkplanItem;
var UserWorkplanSummary = require('capital-models').workplan.UserWorkplanSummary;

module.exports = class UserWorkplanManager extends Manager {

    constructor(db, user) {
        super(db);
        this.user = user;
        this.periodCollection = this.db.collection(Map.workplan.period);
        this.workplanCollection = this.db.collection(Map.workplan.userWorkplan);
    }

    read(accountId) {
        return new Promise((resolve, reject) => {

            this.periodCollection.find().toArray()
                .then(periods => {
                    var promises = [];
                    var _accountId = new ObjectId(accountId);
                    for (var period of periods) {
                        var asyncJob = new Promise((resolve, reject) => {
                            var p = period;
                            var query = { accountId: _accountId, periodId: p._id }
                            this.workplanCollection.dbSingleOrDefault(query)
                                .then(userWorkplan => {
                                    if (userWorkplan) {
                                        resolve(userWorkplan);
                                    }
                                    else {
                                        var wp = new UserWorkplan({ accountId: _accountId, periodId: p._id, period: p });
                                        resolve(wp);
                                    }
                                })
                                .catch(e => reject(e));
                        });
                        promises.push(asyncJob);
                    }

                    Promise.all(promises)
                        .then(result => {
                            resolve(result);
                        })
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));

        });
    }

    get(user, month, period) {
        return new Promise((resolve, reject) => {
            //1. get period.
            this._getPeriod({ month: month, period: period })
                .then(period => {
                    //1a. get period success.
                    var initial = user.initial;
                    var _accountId = new ObjectId(user.id);
                    var query = { accountId: _accountId, periodId: period._id };
                    //2. get user workplan by query.
                    this.workplanCollection.dbSingleOrDefault(query)
                        .then(userWorkplan => {
                            //2a. get user workplan by query success.                            
                            if (userWorkplan == null) {
                                //2a-1. data not found, create and return.
                                var workplan = new UserWorkplan({
                                    accountId: _accountId,
                                    user: user,
                                    periodId: period._id,
                                    period: period,
                                    items: [],
                                    completion: 0
                                });
                                delete (workplan._id);
                                this._validate(user, workplan)
                                    .then(validWorkplan => {
                                        this._ensureIndexes()
                                            .then(indexResults => {
                                                validWorkplan.stamp(this.user.username, 'actor');
                                                this.workplanCollection.dbInsert(validWorkplan)
                                                    .then(result => {
                                                        resolve(result)
                                                    })
                                                    .catch(e => {
                                                        reject(e);
                                                    });
                                            })
                                            .catch(e => {
                                                reject(e);
                                            });
                                    })
                                    .catch(e => {
                                        reject(e);
                                    });
                            }
                            else {
                                //2a-2. data found, return                                
                                var workplan = new UserWorkplan(userWorkplan);
                                workplan.period = period;
                                workplan.periodId = period._id;
                                resolve(workplan);
                            }
                        })
                        //2b. something is wrong when getting user workplan by query.
                        .catch(e => {
                            reject(e);
                        });
                })
                //1b. something is wrong when getting period.
                .catch(e => {
                    reject(e);
                });
        });
    }

    insight(user) {
        return new Promise((resolve, reject) => {
            this._getPeriod()
                .then(period => {
                    this.get(user, period.month, period.period)
                        .then(workplan => resolve(workplan))
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));
        });
    }

    update(user, workplan) {

        return new Promise((resolve, reject) => {

            var _accountId = new ObjectId(workplan.accountId);
            var _periodId = new ObjectId(workplan.periodId);

            var initial = user.initial;
            if (!initial) {
                reject("identity.initial cannot be empty");
            }
            else {
                var periodQuery = { _id: _periodId };

                this._getPeriod(periodQuery)
                    .then(period => {
                        var query = { accountId: _accountId, periodId: _periodId };
                        this.workplanCollection.dbSingle(query)
                            .then(dbWorkplan => {
                                if (dbWorkplan._stamp && dbWorkplan._stamp.toString().length > 0 && dbWorkplan._stamp != workplan._stamp)
                                    reject("stamp mismatch");
                                else {
                                    this._validate(user, new UserWorkplan(Object.assign(dbWorkplan, workplan)))
                                        .then(validWorkplan => {
                                            validWorkplan.stamp(this.user.username, 'actor');
                                            for (var item of validWorkplan.items)
                                                item.stamp(this.user.username, 'actor');

                                            this.workplanCollection.dbUpdate(query, validWorkplan)
                                                .then(doc => {
                                                    resolve(doc);
                                                })
                                                .catch(e => reject(e));
                                        })
                                        .catch(e => reject(e));
                                }
                            })
                            .catch(e => reject(e));
                    })
                    .catch(e => reject(e));
            }
        });
    }

    updateItem(user, month, period, updateItem) {
        return new Promise((resolve, reject) => {
            this.get(user, month, period)
                .then(workplan => {
                    for (var item of workplan.items) {
                        if (item.code == updateItem.code) {
                            var workplanItem = new UserWorkplanItem(Object.assign({}, item, updateItem));
                            workplanItem.userWorkplanId = workplan._id;
                            workplanItem.stamp(user.username, '');

                            if (!item.done && updateItem.done) {
                                var now = moment(new Date()).format("YYYY-MM-DD");
                                workplanItem.completedDate = now;
                            }

                            var index = workplan.items.indexOf(item);
                            workplan.items.splice(index, 1, workplanItem);
                            break;
                        }
                    }
                    this.update(user, workplan)
                        .then(updatedWorkplan => resolve(updatedWorkplan))
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));
        });
    }

    createItem(user, month, period, createItem) {
        return new Promise((resolve, reject) => {
            this.get(user, month, period)
                .then(workplan => {
                    var workplanItem = new UserWorkplanItem(Object.assign({}, item, createItem));
                    workplanItem.userWorkplanId = workplan._id;
                    workplanItem.stamp(user.username, '');

                    if (createItem.done) {
                        var now = moment(new Date()).format("YYYY-MM-DD");
                        workplanItem.completedDate = now;
                    }

                    workplan.items.push(workplanItem);
                    this.update(user, workplan)
                        .then(updatedWorkplan => resolve(updatedWorkplan))
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));
        });
    }

    summary(month, period) {
        return new Promise((resolve, reject) => {
            var query = null;
            if (month && period)
                query = { month: month, period: period };

            this._getPeriod(query)
                .then(period => {
                    var query = { periodId: period._id };
                    this.workplanCollection
                        .find(query)
                        // .toArray()
                        .map(wp => {
                            var total = wp.items.length;
                            var done = wp.items.filter(i => i.done === true && i.cancel === false).length;
                            var cancel = wp.items.filter(i => i.cancel === true).length;
                            var summary = new UserWorkplanSummary(wp);
                            summary.total = total;
                            summary.done = done;
                            summary.cancel = cancel;
                            return summary;
                        })
                        .toArray()
                        .then(collections => {
                            resolve(collections);
                        })
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));
        });
    }

    _getPeriod(query) {
        return new Promise((resolve, reject) => {
            var periodQuery;
            if (query)
                periodQuery = query;
            else {
                var now = moment(new Date()).format("YYYY-MM-DD");
                periodQuery = { $and: [{ from: { $lte: now } }, { to: { $gte: now } }] };
            }

            var periodManager = new PeriodManager(this.db);
            periodManager.get(periodQuery)
                .then(period => {
                    resolve(period);
                })
                .catch(e => reject(e));
        });
    }

    _validate(user, workplan) {
        return new Promise((resolve, reject) => {
            // var _id = null;
            // if (workplan._id && workplan._id.toString().match(/^[0-9a-fA-F]{24}$/))
            //     _id = new ObjectId(workplan._id);

            var accountId = new ObjectId(workplan.accountId);
            var periodId = new ObjectId(workplan.periodId);

            var periodQuery = { _id: periodId };

            this._getPeriod(periodQuery)
                .then(period => {
                    if (!period)
                        reject("invalid period");
                    else {
                        for (var item of workplan.items) {
                            if (!item.type || item.type.length < 1) {
                                reject("workplan contains invalid item: type");
                                return;
                            }
                            else if (!item.name || item.name.length < 1) {
                                reject("workplan contains invalid item: name");
                                return;
                            }
                            else if (item.cancel == true && (!item.cancelReason || item.cancelReason.length < 1)) {
                                reject("workplan contains invalid item: cancel reason");
                                return;
                            }
                        }

                        var userWorkplan = new UserWorkplan(workplan);
                        if (userWorkplan._id && userWorkplan._id.toString().match(/^[0-9a-fA-F]{24}$/))
                            userWorkplan._id = new ObjectId(userWorkplan._id);

                        userWorkplan.accountId = accountId;
                        userWorkplan.user = user;
                        userWorkplan.periodId = periodId;
                        userWorkplan.period = period;
                        userWorkplan.code = period.month + '0' + period.period + user.initial;
                        userWorkplan.code = userWorkplan.code.replace('-', '');

                        var completedCount = 0;
                        var workplanItems = []
                        for (var item of userWorkplan.items) {
                            var userWorkplanItem = new UserWorkplanItem(item);
                            userWorkplanItem.userWorkplanId = userWorkplan._id;

                            userWorkplanItem.no = userWorkplan.items.indexOf(item) + 1;
                            userWorkplanItem.code = userWorkplan.code + (userWorkplanItem.no < 10 ? ('0' + userWorkplanItem.no) : userWorkplanItem.no);
                            userWorkplanItem.stamp('', '');
                            if (userWorkplanItem.done === true)
                                completedCount++;
                            workplanItems.push(userWorkplanItem);
                        }

                        userWorkplan.items = workplanItems;
                        if (userWorkplan.items.length > 0)
                            userWorkplan.completion = (completedCount * 100 / userWorkplan.items.length).toFixed(2);

                        resolve(userWorkplan);
                    }
                })
                .catch(e => reject(e));
        });
    }

    _ensureIndexes() {
        return new Promise((resolve, reject) => {
            // account indexes
            var userWorkplanPromise = this.db.collection(Map.workplan.userWorkplan).createIndexes([
                {
                    key: { accountId: 1, periodId: 1 },
                    name: "ix_user-workplans_accountId_periodId",
                    unique: true
                }]);

            Promise.all([userWorkplanPromise])
                .then(results => resolve(results))
                .catch(e => {
                    reject(e);
                });
        })
    }
}