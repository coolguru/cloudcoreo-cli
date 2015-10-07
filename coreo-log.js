#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var constants = require('./lib/constants')

var fs = require('fs');
var path = require('path');
var httpSync = require('sync-request');
var Table = require('cli-table');
var logHelper = require('./lib/loghelper');

program
    .version('0.0.1')
    .option('-i, --version-id <version_id>', 'the id of the appstack version you want to view the logs of')
    .option("-p, --profile <profileName>", "What profile name to use - default is ['default']");

var profileName = 'default';

program
    .command('tail')
    .description('Tail the log of a running AppStack version')
    .action(function(options){
	// need to get the profile if it exists
	if ( options.parent && options.parent.profile ) {
	    profileName = options.parent.profile;
	}
	if(!options.parent.versionId){
	    throw new Error('You must supply an AppStack version ID to retrieve logs');
	}
        var config = helper.getConfigArray(profileName)[0]
	if(! config || ! config.id) {
	    throw new Error('config not found - Please create one by linking your online account.');
	}
	var startString = new Date(new Date().setHours(new Date().getHours() - 1)).toISOString();
	setTimeout(function(err, data){
	    fromLog= { "appstackinstanceid": { "S": options.parent.versionId }, "time": { "S": startString }, "timestamp": { "N": new Date(startString) * 10000000 }};
	    logHelper.repollLogs(config, fromLog, options.parent.versionId)
	}, 3000);
	
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This lists all of the stack versions running in your CloudCoreo account.');
	console.log('    You must supply a profile name or it will assume [default].');
	console.log();
	console.log('      $ coreo stack list');
	console.log('      -= OR =.');
	console.log('      $ coreo --profile myprofile stack list');
	console.log();
    });

program.parse(process.argv);
