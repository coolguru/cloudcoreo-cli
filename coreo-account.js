#!/usr/bin/env node

var program = require('commander')
var fs = require('fs');
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var jsonfile = require('jsonfile');

var accounts = require('./lib/accounts');;
var helper = require('./lib/helpers');;
var git_obj = require('./lib/git');
var constants = require('./lib/constants')

var passwordInput = [
    {
	name: 'password',
	hidden: true,
	required: true,
	message: 'Enter password for your CloudCoreo account: ',
	limitMessage: 'Password should contain at least one number and be between 6 and 16 characters.',
	pattern: /^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*_]{6,16}$/
    }
];

program
    .version('0.0.1')
    .option("-p, --profile <profileName>", "What profile name to use - default is ['default']");

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var profileName = "default";

function validate(options) {
    // need to get the profile if it exists
    if ( options.parent && options.parent.profile ) {
	profileName = options.parent.profile;
    }
    console.log('using profile [' + profileName + ']');

    // email is a required field
    if ( ! options.email ) {
	console.log('"--email" is a required field');
	process.exit(1)
    }
    
}

program
    .command('test')
    .description('Link your CLI with an existing CloudCoreo account.')
    .option("-e, --email <email>", "What email do you use with your CloudCoreo account")
    .action(function(options){
	var selectionInput = [
	    {
		name: 'selection',
		hidden: false,
		required: true,
		message: 'press <Enter> to select',
		pattern: /\d+$/,
		limitMessage: 'nope'
	    },{
		name: 'selection2',
		hidden: true,
		required: true,
		message: 'press <Enter> to select',
		pattern: /\d+$/,
		limitMessage: 'nope'
	    }
	];

	result = helper.promptSync(selectionInput);
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This will associate a CloudCoreo account with the CLI tool account');
	console.log('    and add a profile to your $HOME/.cloudcoreo/config file');
	console.log();
	console.log('      $ coreo account link -e me@example.com');
	console.log('      -= OR =.');
	console.log('      $ coreo account link --email me@example.com');
	console.log();
    });

// this will link accounts from the web to a profile in the $HOME/.cloudcoreo/config file
// this means:
//   - post up the username and/or email and encryted password
//   - If a web account exists, find it with the provided username or email and a password
//     - If the profile exists, use the information in there to link the web account
//     - If no profile exists, create a new one (same process as the 'solo' run) and link using that
//   - If no web account exists, create one w/ the provided username or email and password (email required)
//     - If the profile exists, use the information in there to link the newly created web account
//     - If no profile exists, create a new one (same process as the 'solo' run) and link using that
program
    .command('link')
    .description('Link your CLI with an existing CloudCoreo account and upsert API keys.')
    .option("-e, --email <email>", "What email do you use with your CloudCoreo account")
    .action(function(options){
	validate(options);
	console.log('looking for config with name ' + profileName);
        var config = helper.getConfigArray(profileName)[0]
	
	if(! config) {
	    console.log('config not found - creating a new one');
	    config = accounts.registerAccountSync(profileName);
	    console.log('config created: ' + JSON.stringify(config));
	}
	console.log('found profile [' + profileName + ']');
	var result = helper.promptSync(passwordInput);
	var password = result.password;
	// now we have a config - lets go link it if we can
	// linking happens like this:
	//   - un-encrypted email sent up w/ encrypted password
	//   - if the auth is successful
	//     - 
	//linkedProfile = accounts.linkAccountToProfile(config, options.username, options.email, password);
	linkedProfile = accounts.linkAccountToProfile(config, null, options.email, password);
	var linkedConfig = helper.clone(config);
	linkedConfig.id = linkedProfile.uuid;
	linkedConfig.accessKeyId = linkedProfile.accessKeyId;
	linkedConfig.secretAccessKey = linkedProfile.secretAccessKey;
	helper.updateConfig(config, linkedConfig);
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This will associate a CloudCoreo account with the CLI tool account');
	console.log('    and add a profile to your $HOME/.cloudcoreo/config file.');
	console.log();
	console.log('    NOTE: This method will create or update API keys. If you need to rotate');
	console.log('          credentials, simply run this command and the old keys will be');
	console.log('          invalidated and replaced with new ones.');
	console.log();
	console.log('      $ coreo --profile myprofile account link -e @example.com');
	console.log('      -= OR =.');
	console.log('      $ coreo --profile myprofile account link --email me@example.com');
	console.log();
    });

program
    .command('create')
    .description('Create a new CloudCoreo account')
    .option("-u, --username <username>", "What username to use on your new account")
    .option("-e, --email <email>", "What email address to use on your new account")
    .action(function(options){
	//console.log(options.parent);
	validate(options);
	if ( ! options.username ) {
	    console.error( "You must specify a username");
	    process.exit(1);
	} else if ( ! options.email ) {
	    console.error( "You must specify a username");
	    process.exit(1);
	}
	
	var result = helper.promptSync(properties);
	if (err) {
	    console.log(err);
	}
	var password = result.password;
	// do work here
	request.post( { 
	    url: constants.signupUrl, 
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
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    This will create a new CloudCoreo account and key pairs,');
	console.log('    which can be used to access your account via the CLI tool.');
	console.log();
	console.log('    The CLI tool will create a $HOME/.cloudcoreo directory and add a');
	console.log('    config file with a JSON representation of the key pair and your username.');
	console.log();
	console.log('      $ coreo account create -u my_new_username -e me@example.com');
	console.log();
    });

program.parse(process.argv);