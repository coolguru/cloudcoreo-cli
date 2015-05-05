#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var read = require('read');
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var jsonfile = require('jsonfile');

var signupUrl = 'http://localhost:3000/api/signup';

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

program
    .version('0.0.1')

program
    .command('create')
    .description('create a new CloudCoreo account')
    .option("-u, --username <username>", "What username to use on your new account")
    .option("-e, --email <email>", "What email address to use on your new account")
    .action(function(options){
	//console.log(options.parent);
	if ( ! options.username ) {
	    console.error( "You must specify a working directory for this AppStack");
	    process.exit(1);
	} else if ( ! options.email ) {
	    console.error( "The specified directory does not exist");
	    process.exit(1);
	}

	read({ prompt : 'Password: ', silent : true }, function (err, password) {
	    if (err) {
		console.log(err);
	    }
	    // do work here
	    request.post( { 
		url: signupUrl, 
		form: {
		    email: options.email, 
		    username: options.username, 
		    betalist: 'true', 
		    password: password 
		}
	    }, function(err, response, body){
		if(err){
		    console.log(err);
		} else {
		    var bo = JSON.parse(body);
		    mkdirp.sync(path.join(getUserHome(), '.cloudcoreo'));
		    var file = path.join(getUserHome(), '.cloudcoreo', 'config');
		    var config = jsonfile.readFileSync(file);
		    var configArray = []
		    // handle user modified screwups array vs. not array etc.
		    if ( Array.isArray(config) ) {
			console.log('in an array');
			for ( var i in config ) {
			    var c = config[i];
			    console.log('checking username: ' + c["username"] + ' == ' + bo["username"]);
			    if (c["username"] == bo["username"]) {
				// just skip this one because we are going to add it anyway
				continue;
			    }
			    configArray.push(c);
			}
		    } else if (config) { // or its there but NOT an array
			// dont add it if it is the same username
			if ( ! config["username"] == bo["username"] ) {
			    configArray.push(config);
			}
		    }
		    // add our new entry
		    configArray.push(bo);
		    jsonfile.writeFileSync(file, configArray);
		}
	    });
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    $ coreo account create -u my_new_username -e me@example.com');
	console.log();
    });

program.parse(process.argv);
