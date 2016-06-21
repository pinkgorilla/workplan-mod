var shared = require('./shared');
var moment = require('moment');
var WorkplanModels = require('workplan-models');
var Period = WorkplanModels.Period;

var signedUser;

function getConnection() {
    return new Promise((resolve, reject) => {
        var factory = require('mongo-factory');
        factory.getConnection(shared.config.connectionString)
            .then(dbInstance => {
                resolve(dbInstance);
            })
            .catch(e => {
                reject(e);
            });
    });
}
exports.getConnection = getConnection;

function getSignedInUser() {
    return new Promise((resolve, reject) => {
        if (signedUser != null)
            resolve(signedUser);
        else {
            getConnection()
                .then(db => {
                    var AccountManager = require('authentication-mod').managers.AccountManager;
                    var accountManager = new AccountManager(db, shared.user);
                    accountManager.accountCollection.first()
                        .then(account => {
                            accountManager.authenticate(account.username, "Standar123")
                                .then(signedInUser => {
                                    signedUser = signedInUser;
                                    resolve(signedUser);
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
    })
}
exports.getSignedInUser = getSignedInUser;

function getPeriodManager() {
    return new Promise((resolve, reject) => {
        getConnection()
            .then(db => {
                getSignedInUser()
                    .then(signedInUser => {
                        var PeriodManager = require('../src/managers/period-manager');
                        manager = new PeriodManager(db, signedInUser);
                        resolve(manager);
                    })
                    .catch(e => {
                        reject(e);
                    });
            })
            .catch(e => {
                reject(e);
            });
    })
}
exports.getPeriodManager = getPeriodManager;

function getUserWorkplanManager() {
    return new Promise((resolve, reject) => {
        getConnection()
            .then(db => {
                getSignedInUser()
                    .then(signedInUser => {
                        var UserWorkplanManager = require('../src/managers/user-workplan-manager');
                        manager = new UserWorkplanManager(db, signedInUser);
                        resolve(manager);
                    })
                    .catch(e => {
                        reject(e);
                    });
            })
            .catch(e => {
                reject(e);
            });
    })
}
exports.getUserWorkplanManager = getUserWorkplanManager;

exports.getLatestPeriod = function () {
    return new Promise((resolve, reject) => {
        getPeriodManager()
            .then(manager => {
                var collection = manager.periodCollection;
                collection.find().sort({ to: -1 }).limit(1).next()
                    .then(latestPeriod => {
                        resolve(latestPeriod);
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

exports.getNewPeriod = function () {
    return new Promise((resolve, reject) => {
        getPeriodManager()
            .then(manager => {
                var collection = manager.periodCollection;

                collection.find().sort({ to: -1 }).limit(1).next()
                    .then(latestPeriod => {
                        var from;
                        var to;
                        var m;
                        if (latestPeriod == null) {
                            m = moment(new Date("1-jun-2016"));
                            from = m.clone().day(1);
                            to = m.clone().day(12);
                        }
                        else {
                            m = moment(latestPeriod.to);
                            from = m.clone().day(8);
                            to = m.clone().day(19);
                        }
                        var month = to.format('YYYY-MM');
                        var period = 0;

                        collection.find({ month: month }).sort({ period: -1 }).limit(1).next()
                            .then(monthPeriod => {
                                if (monthPeriod == null)
                                    period = 1;
                                else {
                                    period = monthPeriod.period + 1;
                                }
                                resolve(new Period({ month: month, period: period, from: from.toDate(), to: to.toDate() }));
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
    });
}