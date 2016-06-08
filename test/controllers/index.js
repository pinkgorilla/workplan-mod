var should = require('should');
var shared = require('../shared');


var initializeServer = function () {
    return new Promise((resolve, reject) => {
        var factory = require('mongo-factory');
        factory.getConnection(shared.config.connectionString)
            .then(db => {

                var controllerOptions = { jwt: { secret: shared.config.jwt.secret } };

                var express = require('express');
                var app = express();

                var passport = require('passport');
                app.use(passport.initialize());

                var bodyParser = require('body-parser');
                app.use(bodyParser.urlencoded({ extended: false }));
                app.use(bodyParser.json());

                var morgan = require('morgan');
                app.use(morgan('dev'));

                var AuthenticationController = require('authentication-mod').controllers.AuthenticationController;
                app.use('/authenticate', new AuthenticationController(db, controllerOptions).router);

                var PeriodController = require('../../src/controllers/period-controller');
                app.use('/periods', new PeriodController(db, controllerOptions).router);

                var UserWorkplanController = require('../../src/controllers/user-workplan-controller');
                app.use('/workplans', new UserWorkplanController(db, controllerOptions).router);


                var port = process.env.PORT || shared.config.server.port;
                app.listen(port);
                console.log("Express server listening on port %d in %s mode", port, 'unit-testing');
                resolve(null);
            })
            .catch(e => done(e));
    })
}

before('initialize server', function (done) {
    initializeServer()
        .then(result => {
            done();
        })
        .catch(e => done(e));
})

var test = shared.test;

test('#period controller', './controllers/period-controller');
test('#user workplan controller', './controllers/user-workplan-controller'); 