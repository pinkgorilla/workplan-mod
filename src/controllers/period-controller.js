'use strict'
var Controller = require('mean-toolkit').Controller;
var PeriodManager = require('../managers/period-manager');

module.exports = class PeriodController extends Controller {

    constructor(db, options) {
        super("1.0.0", options);
        this.db = db;
    }

    initializeRouter(router) {

        var jwt = require('mean-toolkit').passport.jwt;
        jwt.strategy(function (payload, done) {
            return done(null, payload.user);
        }, this.options.jwt.secret);

        // middlewares. 
        router.all('*', jwt.authenticate({ session: false }));

        // routes.
        // POST:/
        router.post('/', (request, response, next) => {
            var user = request.user;
            var periodManager = new PeriodManager(this.db, user);
            periodManager.create(request.body)
                .then(result => {
                    response.locals.data = result;
                    next();
                })
                .catch(e => next(e));
        });

        // GET :/
        router.get('/', (request, response, next) => {
            var user = request.user;
            var periodManager = new PeriodManager(this.db, user);
            periodManager.read()
                .then(result => {
                    response.locals.data = result;
                    next();
                })
                .catch(e => next(e));
        });

        // PUT :/
        router.put('/:month/:period', (request, response, next) => {
            var user = request.user;
            var periodManager = new PeriodManager(this.db, user);
            periodManager.update(request.body)
                .then(result => {
                    response.locals.data = result;
                    next();
                })
                .catch(e => next(e));
        });

        // GET :/month/period
        router.get('/:month/:period', (request, response, next) => {
            var month = request.params.month;
            var period = request.params.period;
            var user = request.user;
            var periodManager = new PeriodManager(this.db, user);
            periodManager.getByMonthAndPeriod(month, period)
                .then(result => {
                    response.locals.data = result;
                    next();
                })
                .catch(e => next(e));
        });

        // DELETE:/username
        router.delete('/:month/:period', (request, response, next) => {
            next("not implemented");
        });
    }
};