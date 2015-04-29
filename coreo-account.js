#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
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

//prompt.start();

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
		return false;
	    }
	    // do work here
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    $ coreo account create -u my_new_username -e me@example.com');
	console.log();
    });

program.parse(process.argv);
