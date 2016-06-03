'use strict'
// external deps
var ObjectId = require('mongodb').ObjectId;
var Sha1 = require('sha1');

// internal deps
var Manager = require('mean-toolkit').Manager;
var Map = require('capital-models').map;

// model types
var Period = require('capital-models').workplan.period;

module.exports = class PeriodManager extends Manager {
    constructor(db, user) {
        super(db);
        this.user = user;
        this.periodCollection = this.db.collection(Map.workplan.period);
    }


    read() {
        return new Promise((resolve, reject) => {
            this.periodCollection.find().toArray()
                .then(periods => {
                    resolve(periods);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getById(periodId) {
        return new Promise((resolve, reject) => {
            var query = { _id: new ObjectId(periodId) };
            this.getByQuery(query)
                .then(period => resolve(period))
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByMonthAndPeriod(month, period) {
        return new Promise((resolve, reject) => {
            var query = { month: month, period: period };
            this.getByQuery(query)
                .then(period => resolve(period))
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByQuery(query) {
        return new Promise((resolve, reject) => {
            //1. get period by query.
            this.periodCollection.dbSingle(query)
                .then(period => {
                    //1a. get period by query success.
                    resolve(period);
                })
                //1b. something is wrong when getting period by query.
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(period) {
        return new Promise((resolve, reject) => {
            var data = new Period(period);
            data.stamp('actor', 'agent');
            data.from = moment(data.from).format("YYYY-MM-DD");
            data.to = moment(data.to).format("YYYY-MM-DD");

            //1. validate period.
            this._validate(data)
                .then(validPeriod => {
                    //1a. validate period success.
                    //2. ensure index.
                    this._ensureIndexes()
                        .then(indexResults => {
                            //2a. ensure index success.
                            validPeriod.stamp(this.user.username, 'agent');
                            //3. insert period.
                            this.periodCollection.dbInsert(data)
                                .then(result => {
                                    //3a. insert period success.
                                    resolve(result);
                                })
                                //3b. something is wrong when inserting period.
                                .catch(e => {
                                    reject(e);
                                });
                        })
                        //2b. something is wrong when ensuring index.
                        .catch(e => {
                            reject(e);
                        });
                })
                //1b. something is wrong validating period.
                .catch(e => {
                    reject(e);
                });
        });
    }

    update(period) {
        return new Promise((resolve, reject) => {
            var data = new Period(period);
            data._id = new ObjectId(period._id);
            data.from = moment(data.from).format("YYYY-MM-DD");
            data.to = moment(data.to).format("YYYY-MM-DD");

            var query = { _id: data._id };
            //1. get period by query.
            this.periodCollection.dbSingle(query)
                .then(dbPeriod => {
                    //1a. get period by query success.
                    //check stamp.
                    if (dbPeriod._stamp && dbPeriod._stamp.toString().length > 0 && dbPeriod._stamp != date._stamp)
                        reject("stamp mismatch");
                    else {
                        var p = new Period(Object.assign({}, dbPeriod, data))
                        //2. validate period.
                        this._validate(p)
                            .then(validPeriod => {
                                //2a. validate period success.
                                validPeriod.stamp(this.user.username, 'agent')
                                //3. update period.
                                this.periodCollection.dbUpdate(query, validPeriod)
                                    .then(doc => {
                                        //3. update period success.
                                        resolve(doc);
                                    })
                                    //3b. something is wrong when updating period.
                                    .catch(e => {
                                        reject(e);
                                    });
                            })
                            //2b. something is wrong when validating period;
                            .catch(e => {
                                reject(e);
                            });
                    }
                })
                //1b. something is wrong when getting period by query.
                .catch(e => {
                    reject(e);
                });
        });
    }

    _ensureIndexes() {
        return new Promise((resolve, reject) => {
            // account indexes
            var periodsPromise = this.periodCollection.createIndexes([
                {
                    key: { month: 1, period: 1 },
                    name: "ix_periods_month_period",
                    unique: true
                }]);

            Promise.all([periodsPromise])
                .then(results => resolve(results))
                .catch(e => {
                    reject(e);
                });
        })
    }

    _validate(period) {
        var vPeriod = new Period(period);
        return new Promise((resolve, reject) => {
            this.periodCollection.find().toArray()
                .then(periods => {
                    for (var p of periods) {
                        if (p._id.toString() != (period._id || '').toString() && this._dateRangeOverlaps(p.from, p.to, period.from, period.to)) {
                            reject("date overlap with another period");
                            return;
                        }
                    }
                    resolve(period);
                })
                .catch(e => reject(e));
        });
    }

    _dateRangeOverlaps(a_start, a_end, b_start, b_end) {
        return (a_start <= b_end) && (a_end >= b_start);
    }
}