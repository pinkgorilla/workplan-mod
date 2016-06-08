var test = require('./shared').test; 

describe('@workplan-mod', function(){
    this.timeout(2 * 60000); 
      
    test('@period-manager', './managers/period-manager');
    test('@workplan-manager', './managers/user-workplan-manager');
    test('#controllers', './controllers');
})