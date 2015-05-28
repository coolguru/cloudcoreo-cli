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
var readlineSync = require('readline-sync');
var bcrypt = require('bcrypt-nodejs');
var NodeRSA = require('node-rsa');
var httpSync = require('sync-request');
var temp = require('temp').track();
var execSync = require('sync-exec');
var exec = require('child_process').exec

var host = 'www.cloudcoreo.com';
var protocol = 'https';
var port = 443;
var host = 'localhost';
var protocol = 'http';
var port = 3000;
var mypath = '/api/solo';

var cloudcoreoGitServer = '';
var tempIdGeneratorUrl = '';

function readConfigFileSync(configFile){
    var configs = [];
    var section = {};
    if (! fs.existsSync(configFile) ) {
        return configs;
    }
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
        var regionMax = 8;
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
            head: ['Num', 'Name', 'From', 'Region', 'Type', 'ID'],
            colWidths: [numMax, nameMax, fromMax, regionMax, typeMax, idMax]
        });
        for(var i in tmpTable){
            table.push(tmpTable[i]);
        }
        console.log(table.toString());
        console.log('');
        console.log('press <Enter> to continue - no entry will result in prompt for credentials');
        console.log('');
        
        var accntNum = readlineSync.question('enter your selection :');
        useCreds = credConfigurations[accntNum];
    }
    if(useCreds){
        keypair.accessKeyId = useCreds.accessKeyId;
        keypair.secretAccessKey = useCreds.secretAccessKey;
        keypair.region = useCreds.region;
        return keypair;
    } else {
        console.log('no existing credentials specified - you must supply new ones');
        console.log('');
        
        var accessKeyId = readlineSync.question('enter a access key id :');
        var secretAccessKey = readlineSync.question('enter your secret access key (we do not store it) :');
        var region = readlineSync.question('enter a default region :');

        keypair.accessKeyId = accessKeyId;
        keypair.secretAccessKey = secretAccessKey;
        keypair.region = region;
        return keypair;
        
    }
}

function mkReq(path, options) {
    options = options || {};
    var url = protocol + '://' + host + ':' + port + path;
    var response = httpSync(options.method, url, options);
    return response;
}

program
    .command('run')
    .description('create a new CloudCoreo account')
    .option("-p, --profile <profile>", "the CloudCoreo profile to use. if it does not exist, it will be created and associated with the cloud account")
    .option("-a, --access-key-id <access-key-id>", "What amazon aws access key id to use")
    .option("-e, --secret-access-key <secret-access-key>", "The secret access key associated with the corresponding access key id")
    .option("-r, --region <region>", "The region in which this should be launched. If nothing is specified, it will look to launch in the default region supplied by a aws cli config file. If there is no cli config specified, an error will occur.")
    .action(function(options){
        // check if there is already a config file if not, sign up and create
        var key = new NodeRSA();
        
        var configs = helper.getConfigArray();
        var profileName = options.profile || 'default';
        var activeConfig;
        var postForm = {};
        var accessKeyId;
        var secretAccessKey;
        var cloudAccountIdentifier;
        var configs = helper.getConfigArray();
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
            
            var headers = {
                'Content-Type': 'application/json'
            };
            var res = mkReq('/api/solo', { method: 'POST', headers: headers, body: JSON.stringify(postForm) });
	    // need to register our cloud account info
            if (res.statusCode == 404){
                console.log('there was a problem with our servers');
                process.exit(1);
            }

            activeConfig = JSON.parse(res.body.toString());
            activeConfig.publicKeyMaterial = postForm.publicKeyMaterial;
            activeConfig.privateKeyMaterial = keyPair.exportKey('private');
            
            helper.addConfig(activeConfig);

        }
        // go get the config again
        var configs = helper.getConfigArray();
        if(configs.length > 0) {
            // lets use a config that we found, get by name eventaully - now just one...
            activeConfig = configs[0];
        } 
        // we are certianly registered now, lets make sure we have a cloud account registered
        if ( ! activeConfig.cloudAccountIdentifier ) { 
            if ( ! options.accessKeyId || ! options.secretAccessKey || ! options.region) {
                // if we are here we either need to have an access key and a secret key
                console.log('you must supply ALL OF: aws access key id, secret access key, region');
                var keypair = getKeysFromUser();
                if ( keypair.accessKeyId.length < 1 || keypair.secretAccessKey.length < 1 ) {
                    console.log('cannot proceed with missing or invalid cloud credentials');
                    process.exit(1);
                }
                // at this point we have a good set of keys to try out
                cloudAccountIdentifier = bcrypt.hashSync(keypair.accessKeyId);
                accessKeyId = keypair.accessKeyId;
                secretAccessKey = keypair.secretAccessKey;
                region = keypair.region;
            } else {
                // else just get the ones passed in on the command line
                cloudAccountIdentifier = bcrypt.hashSync(options.accessKeyId);
                accessKeyId = options.accessKeyId;
                secretAccessKey = options.secretAccessKey;
                region = options.region
            }
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
            
            var headers = {
                'Content-Type': 'application/json'
            };
            var res = mkReq('/api/solo', { method: 'POST', headers: headers, body: JSON.stringify(postForm) });
            if (res.statusCode == 404){
                console.log('your cloud account registration was not found our the system');
                process.exit(1);
            }

            var creds = JSON.parse(res.body.toString());
            if ( creds.arn ) {
                console.log('new role created in the cloud account: ' + creds.arn);
            } else { 
                console.log('something went wrong - are you sure those cloud credentials are correct?');
                process.exit(1);
            }

            newActiveConfig = helper.clone(activeConfig);
            newActiveConfig.region = region;
            newActiveConfig.cloudAccountIdentifier = cloudAccountIdentifier;
            newActiveConfig.arn = creds.arn;
            helper.updateConfig(activeConfig, newActiveConfig);
        }
        // at this point we have a cloudAccountIdentifier that exists in cloudcoreo
        // and/or we have access keys and a cloudAccountIdentifier that doesn't exist yet
        // go get the config again
        var configs = helper.getConfigArray();
        if(configs.length > 0) {
            // lets use a config that we found, get by name eventaully - now just one...
            activeConfig = configs[0];
        } 
        
        var repoUrl = activeConfig.username + "@" + activeConfig.sologitaddress + ":/git/" + activeConfig.username + '/solo.git';
        
        exec("git remote add ccsolo " + repoUrl, function(err, stdout) {
            if (err && err.message.indexOf('already exists') > -1) { 
                remoteUrl = execSync('git config --get remote.ccsolo.url');
                if ( remoteUrl != repoUrl) {
                    console.log('repo has a different repourl - resetting');
                    console.log('git remote set-url ccsolo ' + repoUrl);
                    execSync('git remote set-url ccsolo ' + repoUrl);
                    
                }
            } else if (err) {
                console.log('ERROR: ' + err);
                process.exit(1);
            }
            temp.open('key', function(err, keyTmp) {
                if (!err) {
                    fs.writeSync(keyTmp.fd, activeConfig.privateKeyMaterial);
                    fs.close(keyTmp.fd, function(err) {
                        temp.open('cc-solo', function(err, sshTmp) {
                            if (!err) {
                                var lines = [];
                                lines.push('#!/bin/bash');
                                lines.push('chmod 600 ' + keyTmp.path);
                                lines.push('exec /usr/bin/ssh -o StrictHostKeyChecking=no -i ' + keyTmp.path + ' $@');
                                lines.push('');
                                for(var i in lines) {
                                    fs.writeSync(sshTmp.fd, lines[i] + '\n');
                                }
                                fs.close(sshTmp.fd, function(err) {
                                    exec("chmod +x " + sshTmp.path, function(err, stdout) {
                                        exec("git add . --all 2>&1; git commit -m 'running solo' 2>&1;", function(err, commitOut) {
                                            exec("export GIT_SSH='" + sshTmp.path + "';cat " + sshTmp.path + "; git push ccsolo master 2>&1", function(err, pushOut) {
                                                if ( pushOut.trim().indexOf('master -> master') != -1 ) {
                                                    console.log('changes found and being applied');
                                                } else if (commitOut.trim().indexOf('nothing to commit') > -1 ) {
                                                    console.log('no changes found - ensuring deployment matches your working directory');
                                                }
                                                var bodyUnEnc = {}
                                                bodyUnEnc.action = "runsolo";
                                                bodyUnEnc.repoUrl = repoUrl;
                                                bodyUnEnc.username = activeConfig.username;
                                                bodyUnEnc.sologitaddress = activeConfig.sologitaddress;
                                                bodyUnEnc.cloudAccountIdentifier = activeConfig.cloudAccountIdentifier;

                                                var key = new NodeRSA();
                                                key.importKey(activeConfig.privateKeyMaterial, 'private');

                                                var postForm = {};
                                                postForm.encPayload = key.encryptPrivate(JSON.stringify(bodyUnEnc), 'base64');
                                                postForm.accessKeyId = activeConfig.accessKeyId;
                                                
                                                var headers = {
                                                    'Content-Type': 'application/json'
                                                };
                                                var res = mkReq('/api/solo', { method: 'POST', headers: headers, body: JSON.stringify(postForm) });
                                                if (res.statusCode == 404){
                                                    console.log();
                                                    console.error('something went wrong - it is likely your profile is incorrect or no longer valid');
                                                    process.exit(1);
                                                }
                                                console.log('any deployment modifications should show up in your cloud account in about 30 seconds');
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    });
                }
            });
        });

        // no config file that we can use - creating a new account now
        // // re-get the config array now that we have made it through the new signup process.
        // config = helper.getConfigArray();
        // one with temp creds. This is simply so the process doesn't have to continue
        // over and over again if they want to use solo more often.
        
        // now there is a config file, either old or new it doesnt matter
        // check if there is a cloud account associated with the config file
        
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

