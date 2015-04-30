#!/usr/bin/env node

// var program = require('commander');
// var init_module = require('./coreo-init.js')(program);

// program
//     .version('0.0.1')
//     .command('init')
//     .option('-d', '--stack-dir')
//     .description(init_module.readme());

// console.log('base argv: ' + process.argv);
// program.parse(process.argv);

var program = require('commander');

program
    .version('0.0.1')

program
    .command('init','The init command houses everthing necessary to create new AppStacks')

program
    .command('stack','SubCommands and Actions housed within the stack command will handle all types of AppStack manipulation ');

program.parse(process.argv);

// program
//   .command('stack <cmd>')
//   .alias('ex')
//   .description('execute the given remote cmd')
//   .option("-e, --exec_mode <mode>", "Which exec mode to use")
//   .action(function(cmd, options){
//     console.log('exec "%s" using %s mode', cmd, options.exec_mode);
//   }).on('--help', function() {
//     console.log('  Examples:');
//     console.log();
//     console.log('    $ deploy exec sequential');
//     console.log('    $ deploy exec async');
//     console.log();
//   });

