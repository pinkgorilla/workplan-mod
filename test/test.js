var test = require('./shared').test; 

describe('#authentication-mod', function(){
    this.timeout(2 * 60000); 
      
    test('#period-manager:create', './managers/period-manager/create.js');
    // test('#period-manager:update', './managers/period-manager/update.js');
    // test('#controllers', './controllers');
})