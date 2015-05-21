#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')

program
    .command('init','The init command houses everthing necessary to create new AppStacks')

program
    .command('stack','SubCommands and Actions housed within the stack command will handle all types of AppStack manipulation ');

program
    .command('account','work on a CloudCoreo Account');

program
    .command('solo','run processes on a stack without a CloudCoreo Account');

program.parse(process.argv);
