#!/usr/bin/env node

var program = require('commander');
var git_obj = require('./lib/git');
var helper = require('./lib/helpers');
var fs = require('fs');
var path = require('path');
var httpSync = require('sync-request');

var parent_dir = "";

program
    .version('0.0.1')
    .option('-D, --directory <fully-qualified-path>', 'the working directory')

program
    .command('variables')
    .description('Check that all variables are exposed in the top level variable file')
    .action(function(options){
	var mydir = process.cwd();
	if(options.parent.directory){
	    mydir = options.parent.directory;
	}
	console.log('testing variable configuration in directory structure from ' + mydir)

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
	    });
		
	});
    })
    .on('--help', function(){
	console.log('  Examples:');
	console.log();
	console.log('    Excluding the -D (--directory) option assumes your working directory');
	console.log();
	console.log();
    });

program.parse(process.argv);
