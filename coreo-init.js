#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');

program
    .version('0.0.1')
    .option('-D, --directory <fully-qualified-path>', 'the working directory')

program
    .command('new-stack')
    .description('new description')
    .option("-s, --stack-type <stack type>", "What will this stack be? (server | stack)", /^(server|stack)$/i)
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
	} else if ( ! options.stackType ) {
	    console.error("You must specify a stack type");
	    process.exit(1);
	} else if ( ! /^(server|stack)$/.test(options.stackType) ) {
	    console.error("Invalid Stack Type Specified");
	    process.exit(1);
	}
	var stackType = options.stackType;

	console.log('Creating new %s AppStack', stackType);
	// console.log('######################################################################')
	// console.log('Do Work Here')
	// console.log('######################################################################')

	git_obj.init(options.parent.directory, function(err, data){
	    if(err) {
		console.log(err);
	    } else {
		helper.createServicesDirectory(options.parent.directory, function(err, data){
		    if (err) {
			console.log(err);
		    } else {
			// overrides direcotry has been created
			console.log('done with overrides directory');
		    }
		});
		helper.createOverridesDirectory(options.parent.directory, function(err, data){
		    if (err) {
			console.log(err);
		    } else {
			// overrides direcotry has been created
			console.log('done with services directory');
		    }
		});
		helper.createConfigYamlFile(options.parent.directory, null, function(err, data){
		    if (err) { 
			console.log(err);
		    } else {
			console.log('created config.yaml file');
		    }
		});
		if ( stackType == 'server' ) {
		    helper.createScriptDirectories(options.parent.directory, function(err, data){
			if (err) {
			    console.log(err);
			} else {
			// overrides direcotry has been created
			    console.log('done with services directory');
			}
		    }); 
		}
	    }
	});
    })
    .on('--help', function() {
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory is');
	console.log('    where your AppStack exists.');
	console.log();
	console.log('      $ coreo init new-stack -s server');
	console.log('      $ coreo init new-stack --stack-type stack');
	console.log();
    });
program.parse(process.argv);
