#!/usr/bin/env node

const yargs = require("yargs");
const { createApp } = require('./create');
const { deleteApp } = require("./delete");
const { updateApp } = require("./update/app");
const { deployLambdas } = require("./update/lambdas");

yargs.command('create', 'Create a new React app', yargs => {
  yargs.option('s', {
    alias: 'src',
    description: 'Source JSON file for app parameters',
    string: true
  })
    .option('t', {
      alias: 'token',
      description: 'Github token for repository access',
      string: true
    })
    .demandOption('s')
    .demandOption('t')
}, createApp)
  .command('delete', 'Delete an existing app', yargs => {
    yargs.option('s', {
      alias: 'src',
      description: 'Source JSON file for app parameters',
      string: true
    })
      .demandOption('s')
  }, deleteApp)
  .command('update', 'Update only a specific part of the architecture', yargs => {
    yargs.command('lambdas', 'Deploy lambdas to bucket', yargs => {
      yargs.option('s', {
        alias: 'src',
        description: 'Source JSON file for app parameters',
        string: true
      })
        .option('e', {
          alias: 'environment',
          description: 'deployment environment',
          string: true
        })
        .demandOption('s')
        .demandOption('e')
    }, deployLambdas)
    .command('app', 'Update Amplify app using CF template and parameters', yargs => {
      yargs.option('a', {
        alias: 'alias',
        description: 'App alias',
        string: true
      })
      .demandOption('a')
    }, updateApp)
      .demandCommand()
  })
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