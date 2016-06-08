
var conString = process.env.DB_CONNECTIONSTRING;
var user = {
    username: 'unit-test'
};

exports.test = function (name, path) {
    describe(name, function () {
        require(path);
    })
}

exports.config = {
    connectionString: conString,
    server: {
        host: 'localhost',
        port: 3030,
    },
    jwt: {
        secret: process.env.AUTH_SECRET
    }
};

exports.user = user;
