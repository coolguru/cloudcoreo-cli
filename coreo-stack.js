#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var path = require('path');

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
	//console.log(options.parent);
	if ( ! options.parent.directory ) {
	    options.parent.directory = process.cwd();
	}
	if ( ! fs.existsSync(options.parent.directory) ) {
	    console.error( "The specified directory does not exist");
	    process.exit(1);
	} else if ( ! fs.statSync(options.parent.directory).isDirectory() ) {
	    console.error("The specified path is not a directory");
	    process.exit(1);
	} else if ( ! options.fromGit ) {
	    console.error("You must specify a stack to extend");
	    process.exit(1);
	} else if ( ! options.stackName ) {
	    console.error("You must specify a name (your own) for the sibling stack you are adding");
	    process.exit(1);
	} else if ( ! /^(server|stack)$/.test(options.stackType) ) {
	    console.error("Invalid Stack Type Specified");
	    process.exit(1);
	} else if ( ! /^git@/.test(options.fromGit) ) {
	    console.error("You must specify the git url in SSH format");
	    process.exit(1);
	}
	var extendUrl = options.fromGit;
	var dir = path.join(options.parent.directory, 'stack-' + options.stackName);
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
	console.log('    Excluding the -D (--directory) option assumes your working directory is where your AppStack exists');
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
	//console.log(options.parent);
	if ( ! options.parent.directory ) {
	    options.parent.directory = process.cwd();
	}
	if ( ! fs.existsSync(options.parent.directory) ) {
	    console.error( "The specified directory does not exist");
	    process.exit(1);
	} else if ( ! fs.statSync(options.parent.directory).isDirectory() ) {
	    console.error("The specified path is not a directory");
	    process.exit(1);
	} else if ( ! options.fromGit ) {
	    console.error("You must specify a stack to extend");
	    process.exit(1);
	} else if ( ! /^git@/.test(options.fromGit) ) {
	    console.error("You must specify the git url in SSH format");
	    process.exit(1);
	}
	var extendUrl = options.fromGit;

	console.log('AppStack located in ' + options.parent.directory + ' will now extend AppStack from [' + extendUrl + ']');
	// console.log('######################################################################')
	// console.log('Do Work Here')
	// console.log('######################################################################')

	git_obj.add_submodule(options.parent.directory, String(extendUrl), 'extends', function(err, data){
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
	console.log('    Excluding the -D (--directory) option assumes your working directory is where your AppStack exists');
	console.log('    This command will set your AppStack up to extend the CloudCoreo VPC');
	console.log();
	console.log('      $ coreo -D "/tmp/mystack" stack extend -g git@github.com:cloudcoreo/cloudcoreo-vpc');
	console.log();
    });
program.parse(process.argv);
