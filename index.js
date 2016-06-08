module.exports = {
    controllers: {
        PeriodController: require('./src/controllers/period-controller'),
        UserWorkplanController: require('./src/controllers/user-workplan-controller'),
    },
    managers: {
        PeriodManager: require('./src/managers/period-manager'),
        UserWorkplanManager: require('./src/managers/user-workplan-manager')
    }

}