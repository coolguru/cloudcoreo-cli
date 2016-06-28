var helper = require('./helpers');
var constants = require('./constants')

var NodeRSA = require('node-rsa');
var Table = require('cli-table');
var bcrypt = require('bcrypt-nodejs');
var httpSync = require('sync-request');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

var _this = this;

function registerCloudAccountSync(activeConfig, cloudAccountIdentifier, accessKeyId, secretAccessKey, region){
    if ( ! activeConfig.cloudAccountIdentifier ) { 
        // we have everything we need - lets post up the encrypted payload
        var bodyUnEnc = {};
        bodyUnEnc.cloudAccountIdentifier = cloudAccountIdentifier;
        bodyUnEnc.accessKeyId = accessKeyId;
        bodyUnEnc.secretAccessKey = secretAccessKey;
        bodyUnEnc.region = region;
	
        var key = new NodeRSA();
        key.importKey(activeConfig.privateKeyMaterial, 'private');
        postForm = {};
        postForm.encPayload = key.encryptPrivate(JSON.stringify(bodyUnEnc), 'base64');
        postForm.accessKeyId = activeConfig.accessKeyId;
        
	var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.soloPath;
        var res = helper.mkReq(mypath, { method: 'POST', body: JSON.stringify(postForm) });
        if (res.statusCode == 404){
	    throw new Error('your cloud account registration was not found our the system');
        } else if (res.statusCode >= 500 && res.statusCode <= 599) {
	    throw new Error('server error: ' + res.statusCode);
        }

        var creds = JSON.parse(res.body.toString());
        if ( creds.arn ) {
            console.log('new role created in the cloud account: ' + creds.arn);
        } else { 
	    throw new Error('something went wrong - are you sure those cloud credentials are correct?');
        }
	
        newActiveConfig = helper.clone(activeConfig);
        newActiveConfig.region = region;
        newActiveConfig.cloudAccountIdentifier = cloudAccountIdentifier;
        newActiveConfig.arn = creds.arn;
        helper.updateConfig(activeConfig, newActiveConfig);
    }
    return activeConfig;
}

module.exports.linkAccountToProfile = function(config, webUsername, webEmail, webPassword){
    var encPostForm = {
	password: webPassword,
	config: config
    };

    var unencPostForm = {
	username: webUsername,
	email: webEmail
    };
    var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.linkPath;
    var res = helper.mkReqConfigEncrypted(config, mypath, encPostForm, unencPostForm);
    
    if (res.statusCode == 404){
	throw new Error(JSON.parse(res.body).message);
    } else if (res.statusCode >= 500 && res.statusCode <= 599) {
	throw new Error('server error: ' + res.statusCode);
    }
    var linkedProfile = JSON.parse(res.body);
    return linkedProfile;
};

module.exports.addCloudAccount = function(config, accessKeyId, secretAccessKey, region){
    var cloudAccountIdentifier;
    var keypair = getKeysFromUserSync();
    // we are certianly registered now, lets make sure we have a cloud account registered
    if ( ! accessKeyId || ! secretAccessKey || ! region) {
        // if we are here we either need to have an access key and a secret key
        if ( keypair.accessKeyId.length < 1 || keypair.secretAccessKey.length < 1 ) {
	    throw new Error('cannot proceed with missing or invalid cloud credentials');
        }
        // at this point we have a good set of keys to try out
        cloudAccountIdentifier = bcrypt.hashSync(keypair.accessKeyId);
        accessKeyId = keypair.accessKeyId;
        secretAccessKey = keypair.secretAccessKey;
        region = keypair.region;
    } else {
        // else just get the ones passed in on the command line
        cloudAccountIdentifier = bcrypt.hashSync(accessKeyId);
    }
    var activeConfig = registerCloudAccountSync(config, cloudAccountIdentifier, accessKeyId, secretAccessKey, region);
    // at this point we have a cloudAccountIdentifier that exists in cloudcoreo
    // and/or we have access keys and a cloudAccountIdentifier that doesn't exist yet
    // go get the config again
    var configs = helper.getConfigArray(activeConfig.profileName);
    if(configs.length > 0) {
	// we got a config by profile name - there should only be one, but lets get the 0th element in case
	// someone has done something tricking manually
	activeConfig = configs[0];
    }
    return activeConfig;
}

module.exports.registerAccountSync = function(profileName){
    // check if there is already a config file if not, sign up and create
    var key = new NodeRSA();
    
    var profileName = profileName || 'default';
    var activeConfig;
    var postForm = {};
    var configs = helper.getConfigArray(profileName);
    if(configs.length > 0) {
        // lets use a config that we found, get by name
        activeConfig = configs[0];
    } 
    if ( ! activeConfig || (activeConfig && ! activeConfig.accessKeyId)) { 
        // if there is no config, or
        // there is an active config but no accessKeyId
        // then we need to go up and register
        
        // we still have no config, so we need to do a key exchange.
        var keyPair = key.generateKeyPair(2048);
        postForm.publicKeyMaterial = keyPair.exportKey('public')
        
	var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.soloPath;
        var res = helper.mkReq(mypath, { method: 'POST', body: JSON.stringify(postForm) });
	// need to register our cloud account info
        if (res.statusCode == 404){
	    throw new Error(JSON.parse(res.body).message);
        } else if (res.statusCode >= 500 && res.statusCode <= 599) {
	    throw new Error('server error: ' + res.statusCode);
        }
        activeConfig = JSON.parse(res.body.toString());
        activeConfig.publicKeyMaterial = postForm.publicKeyMaterial;
        activeConfig.privateKeyMaterial = keyPair.exportKey('private');
        activeConfig.profileName = profileName;
	
        helper.addConfig(activeConfig);
	
    }
    // go get the config again
    var configs = helper.getConfigArray(profileName);
    if(configs.length > 0) {
        // lets use a config that we found, get by name eventaully - now just one...
        activeConfig = configs[0];
    } 
    return activeConfig;
}

function readConfigFileSync(configFile, configs){
    var section = {};
    if (! fs.existsSync(configFile) ) {
        return;
    }
    fs.readFileSync(configFile).toString().split('\n').forEach(function (line) { 
        var profileRe = new RegExp(/\[(.*)\]/);
        var profileNames = line.match(profileRe);
        if ( profileNames ) {
            name = profileNames[1].split(' ')[profileNames[1].split(' ').length - 1];
            filename = configFile.split(path.sep)[configFile.split(path.sep).length - 1];
            if (filename in configs) {
                // Look for this name in our config object
                section=configs[filename];
            } else if ( section.name ) {
                // we are in either a new config setting or the first one
                // if the name has been set, we can add the entire section
                configs[filename]=section;
                // save it off and start the new section
                section = {};
            }
            section.name = name;
            section.from = filename;
        }
        var accessKeyRegex = new RegExp(/aws_access_key_id\s*=\s*(.*)\s*$/i);
        var secretKeyRegex = new RegExp(/aws_secret_access_key\s*=\s*(.*)\s*$/i);
        var regionRegex = new RegExp(/region\s*=\s*(.*)\s*$/i);
        accessKeyMatch = line.match(accessKeyRegex);
        secretKeyMatch = line.match(secretKeyRegex);
        regionMatch = line.match(regionRegex);
        
        if(accessKeyMatch){
            section.accessKeyId = accessKeyMatch[1];
        }
        if(secretKeyMatch){
            section.secretAccessKey = secretKeyMatch[1];
        }
        if(regionMatch){
            section.region = regionMatch[1];
        }
    });
    if (section.name && section.accessKeyId && section.secretAccessKey) {
        section.singleFile = true;
        section.completeSection = true;
    }
    if(section.name){
        configs[name]=(section);
    }
}

function getAwsConfigDir() {
    return path.join(helper.getUserHome(), '.aws');
}

function findAWSCredentials(done) {
    var aws_secret_key = process.env['AWS_SECRET_ACCESS_KEY'];
    var aws_access_key = process.env['AWS_ACCESS_KEY_ID'];
    var aws_config_dir = process.env['AWS_CONFIG_DIR'];
    if (!aws_config_dir) {
        aws_config_dir = getAwsConfigDir();
    }

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
        for (var f = 0; f < configfiles.length; f++) {
            var configs = readConfigFileSync(path.join(aws_config_dir, configfiles[f]));
            for(var i = 0; i < configs.length; i++) {
                // lets dedup this stuff
                var isDup = false;
                for(var j=0; j < configurations.length; j++) {
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
    return done(null, configurations);
};

function findAWSCredentialsSync() {
    var aws_secret_key = process.env['AWS_SECRET_ACCESS_KEY'];
    var aws_access_key = process.env['AWS_ACCESS_KEY_ID'];
    var aws_config_dir = process.env['AWS_CONFIG_DIR'];
    if (!aws_config_dir) {
        aws_config_dir = getAwsConfigDir();
    }

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
        var configs = {};
        var configfiles = fs.readdirSync(aws_config_dir);
        for (var f = 0; f < configfiles.length; f++) {
            readConfigFileSync(path.join(aws_config_dir, configfiles[f]), configs);
            var sections = Object.keys(configs);
            sections.forEach(function(name) {
                var section = configs[name];
                // lets dedup this stuff
                var isDup = false;
                for(var j=0; j < configurations.length; j++) {
                    if ( configurations[j].name == section.name && configurations[j].accessKeyId == section.accessKeyId ) {
                        isDup = true;
                    }
                }
                if(! isDup) {
                    configurations.push(section);
                }
            });
        }
    }
    console.log(configurations);
    return configurations;
};

function getAWSKeyInput(keypair, done){
    var awsKeyInput = [
	{
	    name: 'accessKeyId',
	    hidden: false,
	    required: true,
	    message: 'enter a access key id: ',
	    pattern: /[A-Z0-9]{20}/
	},{
	    name: 'secretAccessKey',
	    hidden: false,
	    required: true,
	    message: 'enter a corresponding secret key id: ',
	    pattern: /[A-Za-z0-9\/+=]{40}/
	},{
	    name: 'region',
	    hidden: false,
	    required: true,
	    message: 'enter a default region: ',
	    pattern: /[a-zA-Z0-9-]+/
	}
    ];
    var result = helper.promptSync(awsKeyInput);
    if (err) {
	console.log('prompt fired exception');
	return done(err, null);
    }
    keypair.accessKeyId = result.accessKeyId;
    keypair.secretAccessKey = result.secretAccessKey;
    keypair.region = result.region;
    return done(null, keypair);
}

function getAWSKeyInputSync(keypair){
    var awsKeyInput = [
	{
	    name: 'accessKeyId',
	    hidden: false,
	    required: true,
	    message: 'enter a access key id: ',
	    pattern: /[A-Z0-9]{20}/
	},{
	    name: 'secretAccessKey',
	    hidden: false,
	    required: true,
	    message: 'enter a corresponding secret key id: ',
	    pattern: /[A-Za-z0-9\/+=]{40}/
	},{
	    name: 'region',
	    hidden: false,
	    required: true,
	    message: 'enter a default region: ',
	    pattern: /[a-zA-Z0-9-]+/
	}
    ];
    var result = helper.promptSync(awsKeyInput);
    if (result == null) {
	console.log('prompt fired exception');
	return;
    }
    keypair.accessKeyId = result.accessKeyId;
    keypair.secretAccessKey = result.secretAccessKey;
    keypair.region = result.region;
    return keypair;
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

function getKeysFromUser(done) {
    var keypair = {};
    findAWSCredentials(function(err, credConfigurations){
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
            var nameMax = 10;
            var fromMax = 6;
            var typeMax = 6;
            var idMax = 2;
            var regionMax = 8;
            var tmpTable = []
            for ( var i = 0; i < credConfigurations.length; i++ ){
		var conf = credConfigurations[i];
		var tblEntry = []
		tblEntry.push(i);
		if (i.length + 2 > numMax) { numMax = i.length };
		tblEntry.push(conf.name);
		if (conf.name.length + 2 > nameMax) { nameMax = conf.name.length + 2};
		tblEntry.push(conf.from);
		if (conf.from && conf.from.length + 2 > fromMax) { fromMax = conf.from.length + 2};
		if ( ! conf.region ) { 
                    conf.region = 'us-east-1';
		}
		tblEntry.push(conf.region);
		if (conf.region.length + 2 > regionMax) { regionMax = conf.region.length + 2};
		
		var fromType = "file";
		if ( conf.from == "environment" ){
                    fromType = conf.from;
		}
		tblEntry.push(fromType);
		if (fromType.length + 2 > typeMax) { typeMax = fromType.length + 2};
		
		tblEntry.push(conf.accessKeyId);
		if (conf.accessKeyId && conf.accessKeyId.length + 2 > idMax) { idMax = conf.accessKeyId.length + 2};
		if ( conf.accessKeyId ) {
		    tmpTable.push(tblEntry);
		}
            }
            // add everything to a table now
            var table = new Table({
		chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
			 , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
			 , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
			 , 'right': '' , 'right-mid': '' , 'middle': ' ' },
		style: { 'padding-left': 0, 'padding-right': 0 },
		head: ['Num', 'Name', 'From', 'Region', 'Type', 'ID'],
		colWidths: [numMax, nameMax, fromMax, regionMax, typeMax, idMax]
            });
	    tmpTable.push([tmpTable.length, 'Create New', '', '', '', ''])
            for(var i = 0; i < tmpTable.length; i++){
		table.push(tmpTable[i]);
            }
	    
            console.log(table.toString());
	    var selectionInput = [
		{
		    name: 'selection',
		    hidden: false,
		    required: true,
		    defaultValue: 0,
		    message: 'press <Enter> to select [0: ' + tmpTable[0][1] + ']',
		    pattern: /\d+$/
		}
	    ];
	    var result = helper.promptSync(selectionInput);
	    var accntNum = result.selection;
	    if ( ! accntNum || accntNum == "" ){
		accntNum = 0;
	    }
	    useCreds = credConfigurations[accntNum];
	    
	    if(useCreds){
		keypair.accessKeyId = useCreds.accessKeyId;
		keypair.secretAccessKey = useCreds.secretAccessKey;
		keypair.region = useCreds.region;
		return done(null, keypair);
	    } else {
		getAWSKeyInput(keypair, function(err, keypair){
		    return done(null, keypair);
		});
	    }
	} else {
	    console.log('no existing credentials specified - you must supply new ones');
	    console.log('');
	    
	    getAWSKeyInput(keypair, function(err, keypair){
		return done(null, keypair);
	    });
	}
    });
};
function getKeysFromUserSync() {
    var keypair = {};
    credConfigurations = findAWSCredentialsSync();
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
        var nameMax = 10;
        var fromMax = 6;
        var typeMax = 6;
        var idMax = 2;
        var regionMax = 8;
        var tmpTable = []
        for ( var i = 0; i < credConfigurations.length; i++ ){
	    var conf = credConfigurations[i];
	    var tblEntry = []
	    tblEntry.push(i);
	    if (i.length + 2 > numMax) { numMax = i.length };
	    tblEntry.push(conf.name);
	    if (conf.name.length + 2 > nameMax) { nameMax = conf.name.length + 2};
	    tblEntry.push(conf.from);
	    if (conf.from && conf.from.length + 2 > fromMax) { fromMax = conf.from.length + 2};
	    if ( ! conf.region ) { 
                conf.region = 'us-east-1';
	    }
	    tblEntry.push(conf.region);
	    if (conf.region.length + 2 > regionMax) { regionMax = conf.region.length + 2};
	    
	    var fromType = "file";
	    if ( conf.from == "environment" ){
                fromType = conf.from;
	    }
	    tblEntry.push(fromType);
	    if (fromType.length + 2 > typeMax) { typeMax = fromType.length + 2};
	    
	    tblEntry.push(conf.accessKeyId);
	    if (conf.accessKeyId && conf.accessKeyId.length + 2 > idMax) { idMax = conf.accessKeyId.length + 2};
	    if ( conf.accessKeyId ) {
		tmpTable.push(tblEntry);
	    }
        }
        // add everything to a table now
        var table = new Table({
	    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
		     , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
		     , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
		     , 'right': '' , 'right-mid': '' , 'middle': ' ' },
	    style: { 'padding-left': 0, 'padding-right': 0 },
	    head: ['Num', 'Name', 'From', 'Region', 'Type', 'ID'],
	    colWidths: [numMax, nameMax, fromMax, regionMax, typeMax, idMax]
        });
	tmpTable.push([tmpTable.length, 'Create New', '', '', '', ''])
        for(var i = 0; i < tmpTable.length; i++){
	    table.push(tmpTable[i]);
        }
	
        console.log(table.toString());
	var selectionInput = [
	    {
		name: 'selection',
		hidden: false,
		required: true,
		defaultValue: 0,
		message: 'press <Enter> to select [0: ' + tmpTable[0][1] + ']',
		pattern: /\d+$/
	    }
	];
	var result = helper.promptSync(selectionInput)
	var accntNum = result.selection;
	if ( ! accntNum || accntNum == "" ){
	    accntNum = 0;
	}
	useCreds = credConfigurations[accntNum];
	
	if(useCreds){
	    keypair.accessKeyId = useCreds.accessKeyId;
	    keypair.secretAccessKey = useCreds.secretAccessKey;
	    keypair.region = useCreds.region;
	    return keypair;
	} else {
	    keypair = getAWSKeyInputSync(keypair);
	    return keypair;
	}
    } else {
	console.log('no existing credentials specified - you must supply new ones');
	console.log('');
	
	keypair = getAWSKeyInputSync(keypair);
	return keypair;
    }
};
