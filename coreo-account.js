#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
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
		    // add our new entry
		    helper.addConfig(bo)
		}
	    });
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    This will create a new CloudCoreo account and key pairs');
	console.log('    which can be used for accessing your account via the CLI tool.');
	console.log();
	console.log('    The CLI tool will create a $HOME/.cloudcoreo directory and add a');
	console.log('    config file with a JSON representation of the key pair and your username');
	console.log();
	console.log('      $ coreo account create -u my_new_username -e me@example.com');
	console.log();
    });

program.parse(process.argv);
