#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var constants = require('./lib/constants')

var fs = require('fs');
var path = require('path');
var httpSync = require('sync-request');
var Table = require('cli-table');

program
    .version('0.0.1')
    .option('-i, --version-id <version_id>', 'the id of the appstack version you want to view the logs of')
    .option("-p, --profile <profileName>", "What profile name to use - default is ['default']");

var logLines = [];

function tailLog(error, config, logsJson, versionId){
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
        repollLogs(config, logs[logs.length - 1], versionId);
    }, 3000, logs);
}

function repollLogs(config, fromLog, versionId){
    
    if ( ! fromLog ) { 
        return;
    }
    var appstackInstanceId = fromLog["appstackinstanceid"]["S"];
    
    var startString = new Date(String(fromLog["time"]["S"])).toISOString();
    var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.appstackInstancePath + '/' + versionId + '/logs?start=' + startString;
    tailLog(null, config, JSON.parse(String(helper.mkReqAuthenticated(config, mypath).body)), versionId);
    // if we dont get anything, just run this again
    
    setTimeout(function(){ 
	if(logLines.length == 0) {
            repollLogs(config, fromLog, versionId);
        }
    }, 15000);
    
}

var profileName = 'default';

program
    .command('tail')
    .description('Tail the log of a running appstack version')
    .action(function(options){
	// need to get the profile if it exists
	if ( options.parent && options.parent.profile ) {
	    profileName = options.parent.profile;
	}
	if(!options.parent.versionId){
	    throw new Error('you must supply an appstack version id to retrieve logs');
	}
        var config = helper.getConfigArray(profileName)[0]
	if(! config || ! config.id) {
	    throw new Error('config not found - please create one by linking your online account');
	}
	var startString = new Date(new Date().setHours(new Date().getHours() - 1)).toISOString();
	setTimeout(function(err, data){
	    fromLog= { "appstackinstanceid": { "S": options.parent.versionId }, "time": { "S": startString }, "timestamp": { "N": new Date(startString) * 10000000 }};
	    repollLogs(config, fromLog, options.parent.versionId)
	}, 3000);

	// var stackTable = [];
	// for(var i = 0; i < appstacks.length; i++ ){
	//     var tblEntry = [];
	//     var conf = appstacks[i];
	//     tblEntry.push(conf['_id']);
	//     tblEntry.push(conf['name']);
	//     tblEntry.push(conf['gitUrl']);
	//     stackTable.push(tblEntry);
	// }
        // var table = new Table({
	//     chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
	// 	     , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
	// 	     , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
	// 	     , 'right': '' , 'right-mid': '' , 'middle': ' ' },
	//     style: { 'padding-left': 0, 'padding-right': 0 },
	//     head: ['StackId', 'Name', 'Url'],
	//     colWidths: [10, 25, 75]
        // });
        // for(var i = 0; i < stackTable.length; i++){
	//     table.push(stackTable[i]);
        // }
	
        // console.log(table.toString());
	
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This list all of the stack versions running in your CloudCoreo account.');
	console.log('    You must supply a profile name or it will assume [default].');
	console.log();
	console.log('      $ coreo stack list');
	console.log('      -= OR =.');
	console.log('      $ coreo --profile myprofile stack list');
	console.log();
    });

program.parse(process.argv);
