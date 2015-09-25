#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')

program
    .command('init','The init command houses everything necessary to create new AppStacks');

program
    .command('stack','Subcommands and Actions housed within the stack command will handle all types of AppStack manipulation ');

program
    .command('account','Subcommands for interacting with logged-in CloudCoreo Accounts');

program
    .command('test','teest aspects of your stack');

program
    .command('solo','run processes on a stack without a CloudCoreo Account');

program.parse(process.argv);
