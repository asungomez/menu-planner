#!/usr/bin/env node

const yargs = require("yargs");
const { createApp } = require('./create');
const { deleteApp } = require("./delete");

yargs.command('create', 'Create a new React app', yargs => {
  yargs.option('s', {
    alias: 'src',
    description: 'Source JSON file for app parameters',
    string: true
  })
    .demandOption('s')
}, createApp)
  .command('delete', 'Delete an existing app', yargs => {
    yargs.option('s', {
      alias: 'src',
      description: 'Source JSON file for app parameters',
      string: true
    })
    .demandOption('s')
  }, deleteApp)
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