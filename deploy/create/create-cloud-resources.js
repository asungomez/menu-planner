const chalk = require("chalk");
const fs = require('fs');

const {
  readStringFile,
  checkParameters,
  getOutputValue,
  createStack,
  TEMPLATES_PATH,
  getStackOutput,
  updateRootBackend,
  writeJSONFile,
} = require('../utils');

const createAmplifyApp = async params => {
  checkParameters([
    'appName', 
    'githubToken', 
    'repositoryUrl', 
    'appAlias', 
    'appPath'
  ], params);
  const { appName, githubToken, repositoryUrl, appAlias, appPath } = params;
  console.log();
  console.log(chalk.magentaBright.bold(`Creating ${appName} Amplify app`));
  console.log('This operation can take some minutes');
  const parameters = [
    {
      "ParameterKey": "GithubToken",
      "ParameterValue": githubToken
    },
    {
      "ParameterKey": "AppName",
      "ParameterValue": appName
    },
    {
      "ParameterKey": "Repository",
      "ParameterValue": repositoryUrl
    },
    {
      "ParameterKey": "AppAlias",
      "ParameterValue": appAlias
    }
  ];
  const { outputs } = await createStack(
    `${appName}-amplify-app`,
    ['CAPABILITY_NAMED_IAM'],
    parameters,
    null,
    readStringFile(TEMPLATES_PATH + '/amplify-app.yml')
  );
  parameters[0]['ParameterValue'] = '***'; // Do not commit Github Token into repo
  writeJSONFile(appPath + '/amplify-app-params.json', parameters);
  console.log(chalk.greenBright.bold(`${appName} Amplify app created`));
  const appId = getOutputValue('AppId', outputs);
  return {
    appId: appId
  };
};

const createAmplifyBranch = async params => {
  checkParameters([
    'appName', 
    'appId', 
    'branchName', 
    'environment',
    'appPath'
  ], params);
  const { appName, appId, branchName, environment, appPath } = params;
  console.log();
  console.log(chalk.magentaBright.bold(`Creating ${branchName} branch`));
  console.log('This operation can take some minutes');
  const parameters = [
    {
      "ParameterKey": "AppId",
      "ParameterValue": appId
    },
    {
      "ParameterKey": "BranchName",
      "ParameterValue": branchName
    },
    {
      "ParameterKey": "Environment",
      "ParameterValue": environment
    }
  ];
  await createStack(
    `${appName}-amplify-branch-${branchName}`,
    [],
    parameters,
    null,
    readStringFile(TEMPLATES_PATH + '/amplify-branch.yml')
  );
  if (!fs.existsSync(`${appPath}/${environment}`)) {
    fs.mkdirSync(`${appPath}/${environment}`);
  }
  writeJSONFile(`${appPath}/${environment}/amplify-branch-params.json`, parameters);
  console.log(chalk.greenBright.bold(`${branchName} branch created`));
};

const createBackend = async params => {
  checkParameters(['appName', 'environment', 'appUrl', 'appPath'], params);
  let { appName, environment, appUrl, appPath } = params;
  appName = appName.toLowerCase();
  console.log();
  console.log(chalk.magentaBright.bold(`Creating ${environment} environment`));
  console.log('This operation can take some minutes');
  const parameters = [
    {
      "ParameterKey": "DeploymentBucketName",
      "ParameterValue": `${appName}-bucket-deployment-${environment}`
    },
    {
      "ParameterKey": "AuthRoleName",
      "ParameterValue": `${appName}-role-auth-${environment}`
    },
    {
      "ParameterKey": "UnauthRoleName",
      "ParameterValue": `${appName}-role-unauth-${environment}`
    },
    {
      "ParameterKey": "AppName",
      "ParameterValue": appName
    },
    {
      "ParameterKey": "Environment",
      "ParameterValue": environment
    },
    {
      "ParameterKey": "AppUrl",
      "ParameterValue": appUrl
    },
  ];
  const tags = [
    {
      "Key": "user:Application",
      "Value": appName
    },
    {
      "Key": "user:Stack",
      "Value": environment
    }
  ];
  const { outputs } = await createStack(
    `${appName}-amplify-backend-${environment}`,
    ['CAPABILITY_NAMED_IAM'],
    parameters,
    tags,
    readStringFile(TEMPLATES_PATH + '/backend-root.yml')
  );
  writeJSONFile(`${appPath}/${environment}/backend-root-params.json`, parameters);
  console.log(chalk.greenBright.bold(`${environment} environment created`));
  return {
    AuthRoleName: getOutputValue('AuthRoleName', outputs),
    AuthRoleArn: getOutputValue('AuthRoleArn', outputs),
    UnauthRoleName: getOutputValue('UnauthRoleName', outputs),
    UnauthRoleArn: getOutputValue('UnauthRoleArn', outputs),
    Region: getOutputValue('Region', outputs),
    DeploymentBucketName: getOutputValue('DeploymentBucketName', outputs),
    StackName: getOutputValue('StackName', outputs),
    StackId: getOutputValue('StackId', outputs),
  };
};

const createNestedResources = async (backendData, lambdaS3Keys) => {
  checkParameters(['StackName'], backendData);
  const { StackName: stackName } = backendData;
  console.log();
  console.log(chalk.magentaBright.bold(`Creating nested resources`));
  console.log('This operation can take some minutes');
  const rootOutput = await updateRootBackend(stackName, lambdaS3Keys);
  const authStackName = getOutputValue('AuthStackName', rootOutput);
  const authOutput = await getStackOutput(authStackName);
  delete authOutput.AuthStackName;
  authOutput['TemplateURL'] = getOutputValue('AuthTemplateURL', rootOutput);
  console.log(chalk.greenBright.bold(`Auth created`));
  return authOutput;
};

const createDomain = async params => {
  checkParameters(['appId', 'appName', 'domainName', 'template', 'appPath'], params);
  const { appId, appName, domainName, template, appPath } = params;
  console.log();
  console.log(chalk.magentaBright.bold(`Creating domain ${domainName}`));
  console.log('This operation can take some minutes');
  const parameters = [
    {
      "ParameterKey": "AppId",
      "ParameterValue": appId
    },
    {
      "ParameterKey": "DomainName",
      "ParameterValue": domainName
    },
  ];
  const normalizedDomainName = domainName.replace(/[\W_]+/g, '');
  await createStack(
    `${appName}-amplify-domain-${normalizedDomainName}`,
    [],
    parameters,
    null,
    readStringFile(template)
  );
  writeJSONFile(`${appPath}/domain-params.json`, parameters);
  console.log(chalk.greenBright.bold(`Domain ${domainName} created`));
};

exports.createAmplifyApp = createAmplifyApp;
exports.createAmplifyBranch = createAmplifyBranch;
exports.createBackend = createBackend;
exports.createNestedResources = createNestedResources;
exports.createDomain = createDomain;