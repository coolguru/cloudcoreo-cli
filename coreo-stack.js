#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var constants = require('./lib/constants')

var fs = require('fs');
var path = require('path');
var httpSync = require('sync-request');
var Table = require('cli-table');

program
    .version('0.0.1')
    .option('-s, --stack-id <appstack_id>', 'the id of the appstack you want to list the versions of')
    .option('-D, --directory <fully-qualified-path>', 'the working directory')
    .option("-p, --profile <profileName>", "What profile name to use - default is ['default']");

var profileName = 'default';

var validateInput = function(options){

    // need to get the profile if it exists
    if ( options.parent && options.parent.profile ) {
	profileName = options.parent.profile;
    }
    if ( ! options.parent || ! options.parent.directory ) {
	parent_dir = process.cwd();
    } else {
	parent_dir = options.parent.directory;
    }
    
    if ( ! fs.existsSync(parent_dir) ) {
	console.error( "The specified directory does not exist");
	process.exit(1);
    } else if ( ! fs.statSync(parent_dir).isDirectory() ) {
	console.error("The specified path is not a directory");
	process.exit(1);
    }
    
    // now we need to make sure it has been git init'ed
    if ( ! fs.existsSync(path.join(parent_dir, '.git')) ) {
	git_obj.init(parent_dir, function(err, isInited){
	    if (err) {
		console.log(err);
		process.exit(1);
	    }
	});
    }    
    return
}

program
    .command('generate-readme')
    .description('Generate a readme for the current working directory.')
    .action(function(options){
	helper.generateReadme();
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This will take a few different files and generate a readme for your stack.');
	console.log('    It is handy for automating insertion into the CloudCoreo Hub');
	console.log();
	console.log('    To use properly, create a few files:');
	console.log('      description.md - contains the description for the CloudCoreo Hub entry. Generally a how-to for the stack.');
	console.log('          no example for this one - it can be as long as you want and is all in markdown format');
	console.log();
	console.log('      diagram.md - contains the markdown url for the diagram image');
	console.log('          example diagram.md >');
	console.log('            ![cluster one click diagram](https://raw.githubusercontent.com/CloudCoreo/cluster-one-click/master/images/cluster-diagram.png "cluster in one click")');
	console.log();
	console.log('      icon.md - contains the markdown url for the diagram image');
	console.log('          example icon.md >');
	console.log('            ![cluster one click icon](https://raw.githubusercontent.com/CloudCoreo/cluster-one-click/master/images/cluster-icon.png "cluster in one click")');
	console.log();
	console.log('      head.md - contains the header section. A one-liner usually.');
	console.log('          example head.md >');
	console.log('            stack-one-click');
	console.log('            ============================');
	console.log('            This stack will work with CloudCoreo in a single click.');
	console.log();
	console.log('      tags.md - contains a markdown list of tags to make the stack searchable in the hub');
	console.log('          example tags.md >');
	console.log('            1. Containers');
	console.log('            1. High Availability');
	console.log('            1. Multi-cluster');
	console.log('   Example Usage:');
	console.log('      $ cd <my cool stack base dir>');
	console.log('      $ coreo stack generate-readme');
	console.log();
    });


program
    .command('list')
    .description('List the stack versions running in your CloudCoreo account.')
    .action(function(options){
	validateInput(options)
        var config = helper.getConfigArray(profileName)[0]
	if(! config || ! config.id) {
	    throw new Error('config not found - please create one by linking your online account');
	}
	var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.appstackPath;
	var appstacks = JSON.parse(String(helper.mkReqAuthenticated(config, mypath).body));
	var stackTable = [];
	for(var i = 0; i < appstacks.length; i++ ){
	    var tblEntry = [];
	    var conf = appstacks[i];
	    tblEntry.push(conf['_id']);
	    tblEntry.push(conf['name']);
	    tblEntry.push(conf['gitUrl']);
	    stackTable.push(tblEntry);
	}
        var table = new Table({
	    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
		     , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
		     , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
		     , 'right': '' , 'right-mid': '' , 'middle': ' ' },
	    style: { 'padding-left': 0, 'padding-right': 0 },
	    head: ['StackId', 'Name', 'Url'],
	    colWidths: [10, 25, 75]
        });
        for(var i = 0; i < stackTable.length; i++){
	    table.push(stackTable[i]);
        }
	
        console.log(table.toString());
	
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

program
    .command('list-versions')
    .description('List the versions of the AppStacks running in your CloudCoreo account.')
    .action(function(options){
	validateInput(options);
	if (!options.parent.stackId) {
	    console.log(options.parent);
	    throw new Error('--stack-id is required');
	}
        var config = helper.getConfigArray(profileName)[0]
	if(! config || ! config.id) {
	    throw new Error('config not found - please create one by linking your online account');
	}
	var mypath = constants.protocol + '://' + constants.host + ':' + constants.port + '/' + constants.appstackInstancePath;
	var appstackInstances = JSON.parse(String(helper.mkReqAuthenticated(config, mypath).body));
	var stackTable = [];
	var matchRegex = new RegExp(options.parent.stackId + '.*');
	for(var i = 0; i < appstackInstances.length; i++ ){
	    var tblEntry = [];
	    var conf = appstackInstances[i];
	    if ( matchRegex.test(conf['appStackId']) ) {
		tblEntry.push(conf['appStackId']);
		tblEntry.push(conf['_id']);
		tblEntry.push(conf['name']);
		tblEntry.push(conf['enabled']);
		tblEntry.push(conf['branch']);
		tblEntry.push(conf['revision']);
		stackTable.push(tblEntry);
	    }
	}
        var table = new Table({
	    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
		     , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
		     , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
		     , 'right': '' , 'right-mid': '' , 'middle': ' ' },
	    style: { 'padding-left': 0, 'padding-right': 0 },
	    head: ['StackID', 'VersionID', 'Name', 'Enabled', 'Branch', 'Revision'],
	    colWidths: [10, 25, 25, 8, 20, 20]
        });
        for(var i = 0; i < stackTable.length; i++){
	    table.push(stackTable[i]);
        }
	
        console.log(table.toString());
	
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    This lists all of the stack versions running in your CloudCoreo account.');
	console.log('    You must supply a profile name or it will assume [default].');
	console.log();
	console.log('    You must also supply a Stack ID or partial ID. If you supply a partial');
	console.log('    ID, CloudCoreo will assume you want to see all versions from all matching');
	console.log('    AppStacks. For instance, if you want to see version information for an');
	console.log('    AppStack with id=543ee6737dd1, you can supply that id with:');
	console.log('       --stack-id 543ee6737dd1');

	console.log('    On the other hand, you can supply a value of:');
	console.log('       --stack-id 5');
	console.log('    And CloudCoreo will return all versions for all AppStacks with IDs begining');
	console.log('    with the number 5.');
	console.log();
	console.log('      $ coreo stack --stack-id 543 list-versions');
	console.log('      -= OR =.');
	console.log('      $ coreo --profile myprofile stack -s 543 list-versions');
	console.log();
    });

program
    .command('add')
    .description('Add a sibling stack.')
    .option("-s, --stack-type <stack type>", "What will this stack be? (server | stack)", /^(server|stack)$/i)
    .option("-n, --stack-name <stack name>", "The name you would like to give to the sibling stack.")
    .option("-g, --from-git <git ssh url>", "The Git SSH URL from which this stack will be extended.", /^git@.*$/i)
    .action(function(options){
	validateInput(options);
	if ( ! options.stackName ) {
	    console.warn("You must specify a name (your own) for the sibling stack you are adding.");
	} else if ( ! /^(server|stack)$/.test(options.stackType) ) {
	    console.error("Invalid Stack Type Specified");
	    process.exit(1);
	} else if ( options.fromGit && ! /^git@/.test(options.fromGit) ) {
	    console.warn("You must specify the Git URL in SSH format.");
	}
	var obj = {};
	if ( ! options.fromGit ){ 
	    var mypath = constants.hubProtocol + '://' + constants.hubHost + ':' + constants.hubPort + '/' + 'stacks/' + options;
            var res = helper.mkReq(mypath, { method: 'GET' });
            if (res.statusCode == 404){
                console.log('there was a problem with our servers');
                process.exit(1);
            }
	    obj = JSON.parse(res.body.toString());
	}
	var resolvedStackname = options.stackName;
	if ( ! options.stackName ) {
	    resolvedStackname = obj.name.split('_').slice(0, -1).join('_');
	}
	var extendUrl = "";
	if ( ! options.fromGit ) {
	    extendUrl = obj.repo_url;
	} else {
	    extendUrl = options.fromGit;
	}
	var dir = path.join(parent_dir, 'stack-' + resolvedStackname);
	helper.createServicesDirectory(dir, function(err, data){
	    if (err) {
		console.log(err);
	    } else {
		// overrides direcotry has been created
		console.log('done with overrides directory');
	    }
	});
	helper.createOverridesDirectory(dir, function(err, data){
	    if (err) {
		console.log(err);
	    } else {
		// overrides direcotry has been created
		console.log('done with services directory');
	    }
	});
	helper.createConfigYamlFile(dir, null, function(err, data){
	    if (err) { 
		console.log(err);
	    } else {
		console.log('created config.yaml file');
	    }
	});
	if ( options.stackType == 'server' ) {
	    helper.createScriptDirectories(dir, function(err, data){
		if (err) {
		    console.log(err);
		} else {
		    // overrides direcotry has been created
		    console.log('done with services directory');
		}
	    }); 
	}

	git_obj.add_submodule(dir, String(extendUrl), 'extends', function(err, data){
	    if(err){
		console.log(err);
	    } else {
		console.log('extension complete');
		helper.fixConfigYaml(parent_dir, function(err, data){
		    if (err) {
			console.log('error: ' + err);
			process.exit(1);
		    }
		});
	    }
	});

    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory is');
	console.log('    where your AppStack exists.');
	console.log();
	console.log('    This command will add a VPN server to your AppStack.');
	console.log();
	console.log('      $ coreo stack add -s "server" -g "git@github.com:CloudCoreo/servers-vpn.git" -n "vpn"');
	console.log('      $ coreo stack add --stack-type "server" --from-git "git@github.com:CloudCoreo/servers-vpn.git" -stack-name "vpn"');
	console.log();
    });

program
    .command('extend')
    .description('Extend a stack.')
    .option("-g, --from-git <git ssh url>", "The Git SSH URL from which this stack will be extended.", /^git@.*$/i)
    .action(function(options){
	validateInput(options);
	if ( options.fromGit && ! /^git@/.test(options.fromGit) ) {
	    console.warn("You must specify the git url in SSH format.");
	}
	var obj = {};
	if ( ! options.fromGit ) {
	    var mypath = constants.hubProtocol + '://' + constants.hubHost + ':' + constants.hubPort + '/' + 'stacks/' + options
            var res = helper.mkReq(mypath, { method: 'GET' });
            if (res.statusCode == 404){
                console.log('there was a problem with our servers');
                process.exit(1);
            }
	    obj = JSON.parse(res.body.toString());
	}
	var extendUrl = "";
	if ( ! options.fromGit ) {
	    extendUrl = obj.repo_url;
	} else {
	    extendUrl = options.fromGit;
	}

	console.log('AppStack located in ' + parent_dir + ' will now extend AppStack from [' + extendUrl + ']');
	// console.log('######################################################################')
	// console.log('Do Work Here')
	// console.log('######################################################################')

	git_obj.add_submodule(parent_dir, String(extendUrl), 'extends', function(err, data){
	    if(err){
		console.log(err);
	    } else {
		console.log('extension complete');
		helper.fixConfigYaml(parent_dir, function(err, data){
		    if (err) {
			console.log('error: ' + err);
			process.exit(1);
		    }
		});
	    }
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory is');
	console.log('    where your AppStack exists.');
	console.log();
	console.log('    This command will set your AppStack up to extend the CloudCoreo VPC.');
	console.log();
	console.log('      $ coreo stack extend -g git@github.com:cloudcoreo/cloudcoreo-vpc');
	console.log();
    });
program.parse(process.argv);
