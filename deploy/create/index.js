const chalk = require("chalk");
const AWS = require("aws-sdk");

const {
  readJSONFile, getFileDir,
} = require('../utils');

const {
  createNestedResources,
  createBackend,
  createAmplifyBranch,
  createAmplifyApp,
  createDomain,
} = require('./create-cloud-resources');

const {
  createEnvironmentFiles,
  uploadTemplates,
  updateCommonFiles,
  uploadEnvironmentFiles,
  createAmplifyConfig,
  createDomainTemplate,
  uploadLambdas
} = require('./manage-files');

const createApp = async yargs => {
  try {
    const { src: sourceFile, profile } = yargs;
    const { 
      environments, 
      appName, 
      githubToken, 
      repositoryUrl, 
      domain, 
      alias: appAlias 
    } = readJSONFile(sourceFile);
    const appPath = getFileDir(sourceFile);

    // Create Amplify app
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    const { appId } = await createAmplifyApp({
      environments, 
      appName, 
      githubToken, 
      repositoryUrl, 
      appAlias 
    });
    const subdomains = [];

    // For each environment, create a branch and a backend stack
    if (environments && environments.length > 0) {
      for (const environment of environments) {
        subdomains.push({
          BranchName: environment.branch,
          Prefix: environment.environmentName
        });
        await createAmplifyBranch({
          appName: appName,
          appId: appId,
          branchName: environment.branch,
          environment: environment.environmentName
        });
        const backendData = await createBackend({
          appName: appName,
          environment: environment.environmentName,
          appUrl: `https://${environment.environmentName}.${domain}`
        });
        const environmentData = {
          name: environment.environmentName,
          backendData
        };
        await uploadTemplates(backendData.DeploymentBucketName);
        await uploadLambdas(backendData.DeploymentBucketName, appName);
        const authData = await createNestedResources(backendData);
        createAmplifyConfig(appPath, environmentData, authData);
      }

      const domainTemplate = await createDomainTemplate(appPath, subdomains);
      await createDomain({
        appId: appId,
        appName: appName,
        template: domainTemplate,
        domainName: domain
      });

      console.log();
      console.log(chalk.greenBright.bold(`All resources created in the cloud`));
    }
    else {
      console.log(chalk.greenBright.bold(`All resources created in the cloud`));
    }
  }
  catch (error) {
    console.log(chalk.redBright.bold('ERROR'), error);
  }
};

exports.createApp = createApp;