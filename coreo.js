#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')

program
    .command('init','The init command houses everything necessary to create new AppStacks.');

program
    .command('stack','Subcommands and actions housed within the stack command will handle all types of AppStack manipulation. ');

program
    .command('log','These are subcommands used to view log files.');

program
    .command('account','These are subcommands used for interacting with logged-in CloudCoreo accounts.');

program
    .command('test','Use these to test aspects of your stack.');

program
    .command('solo','Run processes on a stack without a CloudCoreo account with these commands.');

program.parse(process.argv);
