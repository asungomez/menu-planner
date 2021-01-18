const chalk = require("chalk");
const AWS = require("aws-sdk");

const {
  readJSONFile, 
  getFileDir, 
  uploadLambdas,
  APPS_SPEC_PATH
} = require('../utils');

const {
  createNestedResources,
  createBackend,
  createAmplifyBranch,
  createAmplifyApp,
  createDomain,
} = require('./create-cloud-resources');

const {
  uploadTemplates,
  createAmplifyConfig,
  createDomainTemplate,
} = require('./manage-files');

const createApp = async yargs => {
  try {
    const { alias: appAlias, profile, token: githubToken } = yargs;
    const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
    const { 
      environments, 
      appName,
      repositoryUrl, 
      domain,
    } = readJSONFile(sourceFile);
    const appPath = getFileDir(sourceFile);

    // Create Amplify app
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    const { appId } = await createAmplifyApp({
      environments, 
      appName, 
      githubToken, 
      repositoryUrl, 
      appAlias,
      appPath 
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
          environment: environment.environmentName,
          appPath
        });
        const backendData = await createBackend({
          appName: appName,
          environment: environment.environmentName,
          appUrl: `https://${environment.environmentName}.${domain}`,
          appPath
        });
        const environmentData = {
          name: environment.environmentName,
          backendData
        };
        await uploadTemplates(backendData.DeploymentBucketName);
        const lambdaS3Keys = await uploadLambdas(backendData.DeploymentBucketName, appName);
        const authData = await createNestedResources(backendData, lambdaS3Keys, appPath);
        createAmplifyConfig(appPath, environmentData, authData);
      }

      const domainTemplate = await createDomainTemplate(appPath, subdomains);
      await createDomain({
        appId: appId,
        appName: appName,
        template: domainTemplate,
        domainName: domain,
        appPath
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