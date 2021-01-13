const chalk = require("chalk");
const AWS = require("aws-sdk");

const {
  readJSONFile,
} = require('../utils');

const {
  createAuth,
  createBackend,
  createAmplifyBranch,
  createAmplifyApp,
} = require('./create-cloud-resources');

const {
  createEnvironmentFiles,
  uploadTemplates,
  updateCommonFiles,
  uploadEnvironmentFiles
} = require('./manage-files');

const createApp = async yargs => {
  try {
    const { src: sourceFile, profile, environment: defaultEnvironment } = yargs;
    const { environments, appName, githubToken, repositoryUrl } = readJSONFile(sourceFile);

    if (environments && environments.length > 0 && !defaultEnvironment) {
      console.log(chalk.redBright.bold(
        'ERROR: You must define a default environment if an environments array is defined'
      ));
      return;
    }

    // Create Amplify app
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    const { appId } = await createAmplifyApp({ environments, appName, githubToken, repositoryUrl });

    // For each environment, create a branch and a backend stack
    if (environments && environments.length > 0) {
      for (const environment of environments) {
        await createAmplifyBranch({
          appName: appName,
          appId: appId,
          branchName: environment.branch,
          environment: environment.environmentName
        });
        const backendData = await createBackend({
          appName: appName,
          environment: environment.environmentName
        });
        const environmentData = {
          name: environment.environmentName,
          backendData
        };
        await uploadTemplates(backendData.DeploymentBucketName);
        const authData = await createAuth(backendData);
        authData.name = appName.toLowerCase().replace(/[\W_]/, '') + 'auth';
        createEnvironmentFiles(environmentData, authData, appId, appName);
        await uploadEnvironmentFiles(backendData.DeploymentBucketName);
        updateCommonFiles(
          environmentData, 
          authData, 
          appName, 
          appId, 
          profile, 
          defaultEnvironment
        );
      }

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