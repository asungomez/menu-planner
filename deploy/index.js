#!/usr/bin/env node

const yargs = require("yargs");
const { createApp } = require('./create');
const { deleteApp } = require("./delete");
const { updateApp } = require("./update/app");
const { updateBranch } = require("./update/branch");
const { updateDomain } = require("./update/domain");
const { deployLambdas } = require("./update/lambdas");

yargs.command('create', 'Create a new React app', yargs => {
  yargs
    .option('t', {
      alias: 'token',
      description: 'Github token for repository access',
      string: true
    })
    .demandOption('t')
}, createApp)
  .command('delete', 'Delete an existing app', deleteApp)
  .command('update', 'Update only a specific part of the architecture', yargs => {
    yargs.command(
      'lambdas', 
      'Deploy lambdas to bucket', 
      yargs => {
        yargs.option('e', {
          alias: 'environment',
          description: 'Deployment environment',
          string: true
        })
        .demandOption('e')
      }, 
      deployLambdas
      )
      .command(
        'app', 
        'Update Amplify app using CF template and parameters', 
        yargs => {
          yargs.option('t', {
            alias: 'token',
            description: 'Github token for repository access',
            string: true
          })
        }, 
        updateApp
      )
      .command(
        'domain', 
        'Update amplify domain using CF template and parameters', 
        updateDomain
      )
      .command(
        'branch', 
        'Update amplify branch using CF template and parameters', 
        yargs => {
          yargs.option('e', {
            alias: 'environment',
            description: 'Deployment environment',
            string: true
          })
          .demandOption('e')
        },
        updateBranch
      )
      .demandCommand()
  })
  .option('a', {
    alias: 'alias',
    description: 'App alias',
    string: true
  })
  .option('p', {
    alias: 'profile',
    default: 'default',
    defaultDescription: 'AWS default named profile',
    description: 'AWS named profile',
    string: true
  })
  .demandOption('a')
  .demandCommand()
  .help()
  .argv;