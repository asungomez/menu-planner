#!/usr/bin/env node

const yargs = require("yargs");
const { createApp } = require('./create');

yargs.command('create', 'Create a new React app', yargs => {
  yargs.option('s', {
    alias: 'src',
    description: 'Source JSON file for app parameters',
    string: true
  })
    .option('e', {
      alias: 'environment',
      description: 'Local environment to checkout',
      string: true
    })
    .demandOption('s')
}, createApp)
  .option('p', {
    alias: 'profile',
    default: 'default',
    defaultDescription: 'AWS default named profile',
    description: 'AWS named profile',
    string: true
  })
  .demandCommand()
  .help()
  .argv;