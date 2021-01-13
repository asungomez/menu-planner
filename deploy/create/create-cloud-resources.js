const chalk = require("chalk");

const {
  readStringFile,
  checkParameters,
  getOutputValue,
  createStack,
  updateStack,
  TEMPLATES_PATH,
  getStackOutput,
} = require('../utils');

const createAmplifyApp = async params => {
  checkParameters(['appName', 'githubToken', 'repositoryUrl'], params);
  const { appName, githubToken, repositoryUrl } = params;
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
    }
  ];
  const { outputs } = await createStack(
    `${appName}-amplify-app`,
    ['CAPABILITY_NAMED_IAM'],
    parameters,
    null,
    readStringFile(TEMPLATES_PATH + '/amplify-app.yml')
  );
  console.log(chalk.greenBright.bold(`${appName} Amplify app created`));
  const appId = getOutputValue('AppId', outputs);
  return {
    appId: appId
  };
};

const createAmplifyBranch = async params => {
  checkParameters(['appName', 'appId', 'branchName', 'environment'], params);
  const { appName, appId, branchName, environment } = params;
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
  console.log(chalk.greenBright.bold(`${branchName} branch created`));
};

const createBackend = async params => {
  checkParameters(['appName', 'environment'], params);
  let { appName, environment } = params;
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

const createAuth = async params => {
  checkParameters(['StackName'], params);
  const { StackName: stackName } = params;
  console.log();
  console.log(chalk.magentaBright.bold(`Creating authentication`));
  console.log('This operation can take some minutes');
  const parameters = [
    {
      "ParameterKey": "DeploymentBucketName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "AuthRoleName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "UnauthRoleName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "AppName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "Environment",
      "UsePreviousValue": true
    },
  ];
  const { outputs: rootOutput } = await updateStack(
    stackName,
    ['CAPABILITY_NAMED_IAM'],
    parameters,
    null,
    readStringFile(TEMPLATES_PATH + '/backend-root-with-auth.yml')
  );
  const authStackName = getOutputValue('AuthStackName', rootOutput);
  const authOutput = await getStackOutput(authStackName);
  delete authOutput.AuthStackName;
  authOutput['TemplateURL'] = getOutputValue('AuthTemplateURL', rootOutput);
  console.log(chalk.greenBright.bold(`Auth created`));

  return authOutput;
};

exports.createAmplifyApp = createAmplifyApp;
exports.createAmplifyBranch = createAmplifyBranch;
exports.createBackend = createBackend;
exports.createAuth = createAuth;