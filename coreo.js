#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')

program
    .command('init','work pertaining to creating a new AppStack');

program
    .command('stack','work on existing AppStacks');

program
    .command('account','work on a CloudCoreo Account');

program.parse(process.argv);
