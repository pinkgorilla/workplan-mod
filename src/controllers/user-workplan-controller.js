'use strict'
var Controller = require('mean-toolkit').Controller;
var UserWorkplanManager = require('../managers/user-workplan-manager');

module.exports = class UserWorkplanController extends Controller {

    constructor(db, options) {
        super("1.0.0", options);
        this.db = db;
    }

    initializeRouter(router) {

        var jwt = require('mean-toolkit').passport.jwt;
        
        jwt.strategy(function (payload, done) {
            return done(null, payload.user);
        }, this.options.jwt.secret);

        // Parameter checks.
        router.param('month', (request, response, next, value) => {
            next();
        });
        
        router.param('period', (request, response, next, value) => {
            next();
        });

        // middlewares. 
        router.all('*', jwt.authenticate({ session: false }));

        // Routes.
        router.get('/', (request, response, next) => {
            var user = request.user;
            var userWorkplanManager = new UserWorkplanManager(this.db, user);
            userWorkplanManager.read(user.id)
                .then(docs => {
                    response.locals.data = docs;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        });

        router.get('/:month/:period', (request, response, next) => {
            var user = request.user;
            var month = request.params.month;
            var period = request.params.period;
            var userWorkplanManager = new UserWorkplanManager(this.db, user);

            userWorkplanManager.get(user, month, period)
                .then(doc => {
                    response.locals.data = doc;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        });
        
        router.put('/:month/:period', (request, response, next) => {
            var user = request.user;
            var body = request.body;
            var userWorkplanManager = new UserWorkplanManager(this.db, user);

            userWorkplanManager.update(user, body)
                .then(doc => {
                    response.locals.data = doc;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        });

        router.put('/:month/:period/items/:code', (request, response, next) => {
            var user = request.user;
            var month = request.params.month;
            var period = request.params.period;
            var body = request.body;

            var userWorkplanManager = new UserWorkplanManager(this.db, user);

            userWorkplanManager.updateItem(user, month, period, body)
                .then(doc => {
                    response.locals.data = doc;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        });

        router.get('/insight', (request, response, next) => {
            var user = request.user;
            var userWorkplanManager = new UserWorkplanManager(this.db, user);

            userWorkplanManager.insight(user)
                .then(doc => {
                    response.locals.data = doc;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        });
        
        router.get('/summary/:month/:period', (request, response, next) => {
            var user = request.user;
            var month = request.params.month;
            var period = request.params.period;

            var userWorkplanManager = new UserWorkplanManager(this.db, user);

            userWorkplanManager.summary(month, period)
                .then(doc => {
                    response.locals.data = doc;
                    next();
                })
                .catch(e => {
                    next(e);
                });
        })

        router.get('/summary/:month/:period/csv', (request, response, next) => {

            var user = request.user;
            var month = request.params.month;
            var period = request.params.period;

            var userWorkplanManager = new UserWorkplanManager(this.db, user);
            userWorkplanManager.summary(month, period)
                .then(doc => {
                    json2csv({
                        data: doc,
                        fields: ["code", "user.name", "total", "done", "cancel", "completion"]
                    },
                        function (err, csv) {
                            response.set({ 'Content-Disposition': 'attachment; filename=\"' + month + '-P' + period + '.csv\"', 'Content-type': 'text/csv' });
                            response.send(csv);
                        })
                })
                .catch(e => {
                    next(e);
                });
        });
    }
};