#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var path = require('path');
var httpSync;
try {
    httpSync = require('http-sync');
} catch(err) {
    httpSync = require('http-sync-win');
}
var parent_dir = "";

program
    .version('0.0.1')
    .option('-D, --directory <fully-qualified-path>', 'the working directory')

program
    .command('add')
    .description('Add a sibling stack')
    .option("-s, --stack-type <stack type>", "What will this stack be? (server | stack)", /^(server|stack)$/i)
    .option("-n, --stack-name <stack name>", "The name you would like to give to the sibling stack")
    .option("-g, --from-git <git ssh url>", "The git ssh url from which this stack will be extended.", /^git@.*$/i)
    .action(function(options){
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
	} else if ( ! options.fromGit ) {
	    console.warn("You must specify a stack to extend");
	} else if ( ! options.stackName ) {
	    console.warn("You must specify a name (your own) for the sibling stack you are adding");
	} else if ( ! /^(server|stack)$/.test(options.stackType) ) {
	    console.error("Invalid Stack Type Specified");
	    process.exit(1);
	} else if ( ! /^git@/.test(options.fromGit) ) {
	    console.warn("You must specify the git url in SSH format");
	}
	var obj = {};
	if ( ! options.fromGit ){ 
	    var host = 'community.cloudcoreo.com';
	    var protocol = 'http';
	    var port = 80;
	    var mypath = '/stacks/' + options
	    var request = httpSync.request({
		method: 'GET',
		headers: {},
		body: '',
		
		protocol: protocol,
		host: host,
		port: port,
		path: mypath
	    });
 
	    var timedout = false;
	    request.setTimeout(1000, function() {
		console.log("Request Timedout!");
		timedout = true;
	    });
	    var response = request.end();
	    
	    if (!timedout) {
		obj = JSON.parse(response.body.toString());
	    }
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
	    }
	});

    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory is');
	console.log('    where your AppStack exists');
	console.log();
	console.log('    This command will add a VPN server to your AppStack');
	console.log();
	console.log('      $ coreo stack add -s "server" -g "git@github.com:CloudCoreo/servers-vpn.git" -n "vpn"');
	console.log('      $ coreo stack add --stack-type "server" --from-git "git@github.com:CloudCoreo/servers-vpn.git" -stack-name "vpn"');
	console.log();
    });

program
    .command('extend')
    .description('Extend a stack')
    .option("-g, --from-git <git ssh url>", "The git ssh url from which this stack will be extended.", /^git@.*$/i)
    .action(function(options){
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
	} else if ( ! options.fromGit ) {
	    console.warn("You must specify a stack to extend");
	} else if ( ! /^git@/.test(options.fromGit) ) {
	    console.warn("You must specify the git url in SSH format");
	}
	var obj = {};
	if ( ! options.fromGit ) {
	    var host = 'community.cloudcoreo.com';
	    var port = 80
	    var protocol = 'http';
	    var mypath = '/stacks/' + options
	    var request = httpSync.request({
		method: 'GET',
		headers: {},
		body: '',
		
		protocol: protocol,
		host: host,
		port: port,
		path: mypath
	    });
 
	    var timedout = false;
	    request.setTimeout(1000, function() {
		console.log("Request Timedout!");
		timedout = true;
	    });
	    var response = request.end();
	    
	    if (!timedout) {
		obj = JSON.parse(response.body.toString());
	    }
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
	    }
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory is');
	console.log('    where your AppStack exists');
	console.log();
	console.log('    This command will set your AppStack up to extend the CloudCoreo VPC');
	console.log();
	console.log('      $ coreo stack extend -g git@github.com:cloudcoreo/cloudcoreo-vpc');
	console.log();
    });
program.parse(process.argv);
