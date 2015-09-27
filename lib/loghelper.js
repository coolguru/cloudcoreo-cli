var constants = require('./constants');
var helper = require('./helpers');

var logLines = [];
var _this = this;

module.exports.tailLog = function(error, config, logsJson, versionId){
    var logs = logsJson;

    if ( logs[0] ){
	var smLogs = logs.slice(Math.max(logs.length - 100, 1))
        smLogs.forEach(function(d) {
	    //logLines.push([d["appstackinstanceid"]["S"], d["timestamp"]["N"], new Date(d["time"]["S"]), d["resourcetype"]["S"],d["resourcename"]["S"], d["message"]["S"]]);
	    var entry = new Date(d["time"]["S"]) + ' | ' + d["resourcetype"]["S"] + '[' + d["resourcename"]["S"] + '] | ' + d["message"]["S"];
	    if ( logLines.indexOf(entry) == -1 ){
		logLines.push(entry);
		console.log(entry);
	    }
        });
    }
    setTimeout(function(logs){ 
        _this.repollLogs(config, logs[logs.length - 1], versionId);
    }, 3000, logs);
}

module.exports.repollLogs = function(config, fromLog, versionId){
    if ( ! fromLog ) { 
        return;
    }
    var appstackInstanceId = fromLog["appstackinstanceid"]["S"];
    
    var startString = new Date(String(fromLog["time"]["S"])).toISOString();
    var logpath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.appstackInstancePath + '/' + versionId + '/logs?start=' + startString;
    _this.tailLog(null, config, JSON.parse(String(helper.mkReqAuthenticated(config, logpath).body)), versionId);
    // if we dont get anything, just run this again
    
    setTimeout(function(){ 
	if(! logLines || logLines.length == 0) {
	    console.log('Generating plan - please wait...');
            _this.repollLogs(config, fromLog, versionId);
        }
    }, 5000);
}
