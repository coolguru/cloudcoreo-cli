#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var jsonfile = require('jsonfile');
var prompt = require('prompt');
var properties = [
    {
	name: 'password',
	hidden: true,
	required: true,
	message: 'password should contain at least one number and be between 6 and 16 characters',
	pattern: /^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,16}$/
    }
];

var signupUrl = 'https://www.cloudcoreo.com/api/signup';

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

	prompt.start();
	prompt.get(properties, function (err, result) {
	    if (err) {
		console.log(err);
	    }
	    console.log('getting');
	    var password = result.password;
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
		    console.log(body);
		    var bo = JSON.parse(body);
		    mkdirp.sync(path.join(getUserHome(), '.cloudcoreo'));
		    var file = path.join(getUserHome(), '.cloudcoreo', 'config');
		    fs.exists(file, function(exists) {
			var config = []
			if (exists) {
			    config = jsonfile.readFileSync(file);
			}
			var configArray = []
			// handle user modified screwups array vs. not array etc.
			if ( Array.isArray(config) ) {
			    for ( var i in config ) {
				var c = config[i];
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
		    });
		}
	    });
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    This will create a new CloudCoreo account and key pairs');
	console.log('    which can be used for accesing your account via the CLI tool.');
	console.log();
	console.log('    The cli tool will create a $HOME/.cloudcoreo directory and add a');
	console.log('    config file with a JSON representation of the key pair and your username');
	console.log();
	console.log('      $ coreo account create -u my_new_username -e me@example.com');
	console.log();
    });

program.parse(process.argv);
