#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var request = require('request');
var mkdirp = require('mkdirp');
var path = require('path');
var jsonfile = require('jsonfile');
var lineReader = require('line-reader');
var util = require('util');
var Table = require('cli-table');
var prompt = require('sync-prompt').prompt;

var cloudcoreoGitServer = '';
var tempIdGeneratorUrl = '';

function readConfigFileSync(configFile){
    var configs = [];
    var section = {};
    fs.readFileSync(configFile).toString().split('\n').forEach(function (line) { 
	var profileRe = new RegExp(/\[(.*)\]/);
	var profileNames = line.match(profileRe);
	if ( profileNames ) {
	    // we are in either a new config setting or the first one
	    if ( section.name ) {
		// if the name has been set, we can add the entire section
		configs.push(section);
		// save it off and start the new section
		section = {};
	    }
	    section.name = profileNames[1].split(' ')[profileNames[1].split(' ').length - 1];
	    section.from = configFile.split(path.sep)[configFile.split(path.sep).length - 1];
	}
	var accessKeyRegex = new RegExp(/aws_access_key_id\s*=\s*(.*)\s*$/i);
	var secretKeyRegex = new RegExp(/aws_secret_access_key\s*=\s*(.*)\s*$/i);
	accessKeyMatch = line.match(accessKeyRegex);
	secretKeyMatch = line.match(secretKeyRegex);
	
	if(accessKeyMatch){
	    section.accessKeyId = accessKeyMatch[1];
	}
	if(secretKeyMatch){
	    section.secretAccessKey = secretKeyMatch[1];
	}
    });
    if(section.name){
	configs.push(section);
    }
    return configs;
}

function findAWSCredentials() {
    var aws_config_file = process.env['AWS_CONFIG_FILE'];
    var aws_secret_key = process.env['AWS_SECRET_ACCESS_KEY'];
    var aws_access_key = process.env['AWS_ACCESS_KEY_ID'];
    var aws_config_dir = getAwsConfigDir();

    configurations = [];
    if ( aws_secret_key && aws_access_key ) {
	var memSection = {};
	memSection.name = 'current';
	memSection.from = 'environment';
	memSection.secretAccessKey = aws_secret_key;
	memSection.accessKeyId = aws_access_key;
	configurations.push(memSection);
    }

    if ( fs.existsSync(aws_config_dir)){
	var configfiles = fs.readdirSync(aws_config_dir);
	if ( aws_config_file ) {
	    configfiles.push(aws_config_file);
	}
	for (var f in configfiles) {
	    var configs = readConfigFileSync(path.join(getAwsConfigDir(), configfiles[f]));
	    for(var i in configs) {
		// lets dedup this stuff
		var isDup = false;
		for(var j in configurations) {
		    if ( configurations[j].name == configs[i].name && configurations[j].accessKeyId == configs[i].accessKeyId ) {
			isDup = true;
		    }
		}
		if(! isDup) {
		    configurations.push(configs[i]);
		}
	    }
	}
    }
    return configurations;
}
function getAwsConfigDir() {
    return path.join(helper.getUserHome(), '.aws');
}

function getKeysFromUser() {
    var keypair = {};
	var credConfigurations = findAWSCredentials();
	var useCreds;
	if ( credConfigurations.length > 0 ) {
	    // there are "on-premise" cloud credentials we can use
	    console.log();
	    console.log('we found credentials on this machine');
	    console.log();
	    console.log('CloudCoreo will use these to create a new role in your account with the');
	    console.log('following policy, which will be assumed to manage resources in your account:');
	    console.log('');
	    console.log('IMPORTANT: we will NEVER store any of your keys in our system');
	    console.log('');
	    console.log('{');
	    console.log('  "Version": "2012-10-17",');
	    console.log('  "Statement": [');
	    console.log('    {');
	    console.log('      "Effect": "Allow",');
	    console.log('      "Action": [');
	    console.log('        "iam:GetUser",');
	    console.log('        "iam:CreatePolicy",');
	    console.log('        "iam:GetPolicy",');
	    console.log('        "iam:CreateRole",');
	    console.log('        "iam:GetRole",');
	    console.log('        "iam:AttachRolePolicy"');
	    console.log('      ],');
	    console.log('      "Resource": "*"');
	    console.log('    }');
	    console.log('  ]');
	    console.log('}');
	    console.log('');
	    console.log('please enter the number corresponding to the account with which you would like to link');
	    console.log('');
	    //lets autogen the table dimensions
	    var numMax = 5;
	    var nameMax = 6;
	    var fromMax = 6;
	    var typeMax = 6;
	    var idMax = 2;
	    var tmpTable = []
	    for ( var i in credConfigurations ){
		var conf = credConfigurations[i];
		var tblEntry = []
		tblEntry.push(i);
		if (i.length + 2 > numMax) { numMax = i.length };
		tblEntry.push(conf.name);
		if (conf.name.length + 2 > nameMax) { nameMax = conf.name.length + 2};
		tblEntry.push(conf.from);
		if (conf.from.length + 2 > fromMax) { fromMax = conf.from.length + 2};

		var fromType = "file";
		if ( conf.from == "environment" ){
		    fromType = conf.from;
		}
		tblEntry.push(fromType);
		if (fromType.length + 2 > typeMax) { typeMax = fromType.length + 2};

		tblEntry.push(conf.accessKeyId);
		if (conf.accessKeyId.length + 2 > idMax) { idMax = conf.accessKeyId.length + 2};

		tmpTable.push(tblEntry);
	    }
	    // add everything to a table now
	    var table = new Table({
		chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
			 , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
			 , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
			 , 'right': '' , 'right-mid': '' , 'middle': ' ' },
		style: { 'padding-left': 0, 'padding-right': 0 },
		head: ['Num', 'Name', 'From', 'Type', 'ID'],
		colWidths: [numMax, nameMax, fromMax, typeMax, idMax]
	    });
	    for(var i in tmpTable){
		table.push(tmpTable[i]);
	    }
	    console.log(table.toString());
	    console.log('');
	    console.log('press <Enter> to continue - no entry will result in prompt for credentials');
	    console.log('');
	    var accntNum = prompt('account number to link: ');
	    console.log('');
	    useCreds = credConfigurations[accntNum];
	}

	if ( useCreds ) {
	    console.log('using credentials: "' + useCreds.name + '" from ' + useCreds.from);
	    console.log('');
	    keypair.accessKeyId = useCreds.accessKeyId;
	    keypair.secretAccessKey = useCreds.secretAccessKey;

	} else {
	    console.log('no existing credentials specified - you must supply new ones');
	    console.log('');
	    var accessKeyId = prompt('access key id: ');
	    var secretAccessKey = prompt('secret access key: ');
	    keypair.accessKeyId = accessKeyId;
	    keypair.secretAccessKey = secretAccessKey;
	}
    return keypair;
}

program
    .command('run')
    .description('create a new CloudCoreo account')
    .option("-a, --access-key-id <access-key-id>", "What amazon aws access key id to use")
    .option("-e, --secret-access-key <secret-access-key>", "The secret access key associated with the corresponding access key id")
    .action(function(options){
	// check if there is already a config file if not, sign up and create
	var config = helper.getCloudCoreoConfig();
	// one with temp creds. This is simply so the process doesn't have to continue
	// over and over again if they want to use solo more often.

	// now there is a config file, either old or new it doesnt matter
	// check if there is a cloud account associated with the config file

	// if there is no account, get the creds from the user
	//var keypair = getKeysFromUser();
	// use the new keys to set up the cloud account and associate it with the values from the config file
	// now the cloud account is set up and associated w/ this temp user in CC
	
	// print out variables that will be used to give the user an opportunity to change them
	// flag variables that are not defaulted
	// git push the current dir to the temp git repo server in cloudcoreo
	// send a post to cloudcoreo.com to kick off the process.
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

