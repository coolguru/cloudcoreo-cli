#!/usr/bin/env node

var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var accounts = require('./lib/accounts');

var NodeRSA = require('node-rsa');
var program = require('commander');
var request = require('request');
var Table = require('cli-table');
var execSync = require('sync-exec');
var exec = require('child_process').exec
var path = require('path');

var cloudcoreoGitServer = '';
var tempIdGeneratorUrl = '';

program
    .command('run')
    .description('create a new CloudCoreo account')
    .option("-p, --profile <profile>", "the CloudCoreo profile to use. if it does not exist, it will be created and associated with the cloud account")
    .option("-a, --access-key-id <access-key-id>", "What amazon aws access key id to use")
    .option("-e, --secret-access-key <secret-access-key>", "The secret access key associated with the corresponding access key id")
    .option("-r, --region <region>", "The region in which this should be launched. If nothing is specified, it will look to launch in the default region supplied by a aws cli config file. If there is no cli config specified, an error will occur.")
    .action(function(options){
	var mydir = process.cwd();
	if(options.parent.directory){
	    mydir = options.parent.directory;
	}
	helper.fixConfigYaml(mydir, function(err, data){
	    if (err) {
		console.log(err);
		process.exit(1);
	    }
	    
	    helper.validateRequiredVariables(path.join(mydir, "config.yaml"), function(err, fixed){
		if(err){
		    console.log(err);
		    process.exit(1);
		}
		var activeConfig = accounts.registerAccountSync(options.profile);
		activeConfig = accounts.addCloudAccount(activeConfig, options.accessKeyId, options.secretAccessKey, options.region);
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
		    helper.check_git_config(process.cwd(), function(err, data){ 
			helper.git_cmd(process.cwd(), activeConfig.privateKeyMaterial, "git add " + process.cwd() + " --all", {}, [], function(err, addOut){
			    helper.git_cmd(process.cwd(), activeConfig.privateKeyMaterial, "git commit -m \'solo_run\'", {}, [], function(err, commitOut) {
				helper.git_cmd(process.cwd(), activeConfig.privateKeyMaterial, "git push ccsolo master", {}, [], function(err, pushOut) {
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
				    var urlPath = constants.protocol + '://' + constants.host + ':' + constants.port + '/api/solo';
				    var res = accounts.mkReq(urlPath, { method: 'POST', headers: headers, body: JSON.stringify(postForm) });
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
		});
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

