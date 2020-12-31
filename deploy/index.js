#!/usr/bin/env node

const chalk = require("chalk");
const yargs = require("yargs");
const AWS = require("aws-sdk");
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const TEMPLATES_PATH = path.join(__dirname, '..', 'iac', 'templates');
const AMPLIFY_PATH = path.join(__dirname, '..', 'amplify');

const PROJECT_CONFIG = {
  "providers": [
    "awscloudformation"
  ],
  "projectName": null,
  "version": "3.0",
  "frontend": "javascript",
  "javascript": {
    "framework": "react",
    "config": {
      "SourceDir": "src",
      "DistributionDir": "build",
      "BuildCommand": "npm run-script build",
      "StartCommand": "npm run-script start"
    }
  }
};

const LOCAL_AWS_INFO = {
  "configLevel": "project",
  "useProfile": true,
  "profileName": null,
  "AmplifyAppId": null
};

const LOCAL_ENV_INFO = {
  "projectPath": null,
  "defaultEditor": "vscode",
  "envName": null
};

const TAGS = [
  {
    "Key": "user:Stack",
    "Value": "{project-env}"
  },
  {
    "Key": "user:Application",
    "Value": "{project-name}"
  }
];

const zipFiles = (files, zipPath) => {
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip');
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', error => reject(error));
    archive.pipe(output);
    for (const file of files) {
      const filePathParts = file.split('/');
      const fileName = filePathParts[filePathParts.length - 1];
      archive.file(file, {name: fileName});
    }
    archive.finalize();
  });
};

const readJSONFile = (fileName) => {
  const rawData = fs.readFileSync(fileName);
  return JSON.parse(rawData);
};

const writeJSONFile = (fileName, data) => {
  fs.writeFileSync(fileName, JSON.stringify(data));
};

const readStringFile = (fileName) => {
  return fs.readFileSync(fileName).toString();
};

const checkParameters = (requiredParams, parameters) => {
  for (const param of requiredParams) {
    if (!parameters[param]) {
      throw new Error('Missing parameter ' + param);
    }
  }
};

const getOutputValue = (key, outputs) => {
  return outputs.filter(output => output.OutputKey === key)[0].OutputValue;
};

const uploadFile = (bucket, source, destination) => {
  const s3 = new AWS.S3({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  return new Promise((resolve, reject) => {
    s3.upload({
      ACL: 'bucket-owner-full-control',
      Body: fs.createReadStream(source),
      Bucket: bucket,
      Key: destination
    }, (error) => {
      if(error) {
        reject(error);
      }
      else {
        resolve();
      }
    });
  });
};

const createStack = (stackName, capabilities, parameters, tags, template) => {
  const cloudFormation = new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  return new Promise((resolve, reject) => {
    cloudFormation.createStack({
      StackName: stackName,
      Capabilities: capabilities,
      Parameters: parameters,
      Tags: tags,
      TemplateBody: template
    }, (error, stackData) => {
      if (error) {
        reject(error);
      }
      else {
        cloudFormation.waitFor('stackCreateComplete', { StackName: stackName }, (error, waitData) => {
          if (error) {
            reject(error);
          }
          else {
            resolve({
              stackId: stackData.StackId,
              outputs: waitData.Stacks[0].Outputs
            });
          }
        });
      }
    });
  });
};

const updateBucket = async bucketName => {
  console.log();
  console.log(chalk.magentaBright.bold(`Uploading files to deployment bucket`));
  console.log('This operation can take some minutes');
  await zipFiles(
    [
      AMPLIFY_PATH + '/#current-cloud-backend/amplify-meta.json',
      AMPLIFY_PATH + '/#current-cloud-backend/backend-config.json',
      AMPLIFY_PATH + '/#current-cloud-backend/tags.json',
      AMPLIFY_PATH + '/#current-cloud-backend/nested-cloudformation-stack.yml'
    ],
    AMPLIFY_PATH + '/#current-cloud-backend/current-cloud-backend.zip'
  );
  await uploadFile(
    bucketName, 
    AMPLIFY_PATH + '/#current-cloud-backend/current-cloud-backend.zip', 
    '#current-cloud-backend.zip'
  );
  await uploadFile(
    bucketName, 
    AMPLIFY_PATH + '/#current-cloud-backend/amplify-meta.json', 
    'amplify-meta.json'
  );
  await uploadFile(
    bucketName, 
    AMPLIFY_PATH + '/#current-cloud-backend/backend-config.json', 
    'backend-config.json'
  );
  await uploadFile(
    bucketName, 
    AMPLIFY_PATH + '/#current-cloud-backend/nested-cloudformation-stack.yml', 
    'nested-cloudformation-stack.yml'
  );
  fs.unlinkSync(AMPLIFY_PATH + '/#current-cloud-backend/current-cloud-backend.zip');
  console.log(chalk.greenBright.bold('All files uploaded'));
};

const updateBackendFiles = (teamProviderInfo, appName, defaultEnvironment, profile) => {
  console.log();
  console.log(chalk.magentaBright.bold('Updating local files'));
  /** Root files */
  if (!fs.existsSync(AMPLIFY_PATH)) {
    fs.mkdirSync(AMPLIFY_PATH);
  }
  if (!fs.existsSync(AMPLIFY_PATH + '/team-provider-info.json')) {
    writeJSONFile(AMPLIFY_PATH + '/team-provider-info.json', {});
  }
  const previousTeamProviderInfo = readJSONFile(AMPLIFY_PATH + '/team-provider-info.json');
  const updatedTeamProviderInfo = { ...previousTeamProviderInfo };
  for (const environment in teamProviderInfo) {
    updatedTeamProviderInfo[environment] = teamProviderInfo[environment];
  }
  writeJSONFile(AMPLIFY_PATH + '/team-provider-info.json', updatedTeamProviderInfo);
  if (!fs.existsSync(AMPLIFY_PATH + '/cli.json')) {
    writeJSONFile(AMPLIFY_PATH + '/cli.json', { "features": {} });
  }
  /** .config directory */
  if (!fs.existsSync(AMPLIFY_PATH + '/.config')) {
    fs.mkdirSync(AMPLIFY_PATH + '/.config');
  }
  if (!fs.existsSync(AMPLIFY_PATH + '/.config/project-config.json')) {
    PROJECT_CONFIG['projectName'] = appName;
    writeJSONFile(AMPLIFY_PATH + '/.config/project-config.json', PROJECT_CONFIG);
  }
  if (!fs.existsSync(AMPLIFY_PATH + '/.config/local-aws-info.json')) {
    writeJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json', {});
  }
  const previousLocalAWSInfo = readJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json');
  const updatedLocalAWSInfo = { ...previousLocalAWSInfo };
  for (const environment in teamProviderInfo) {
    updatedLocalAWSInfo[environment] = {
      ...LOCAL_AWS_INFO,
      profileName: profile,
      AmplifyAppId: teamProviderInfo[environment].awscloudformation.AmplifyAppId
    };
  }
  writeJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json', updatedLocalAWSInfo);
  const localDirectory = path.join(__dirname,).replace('/deploy', '');
  LOCAL_ENV_INFO['envName'] = defaultEnvironment;
  LOCAL_ENV_INFO['projectPath'] = localDirectory;
  writeJSONFile(AMPLIFY_PATH + '/.config/local-env-info.json', LOCAL_ENV_INFO);
  /** #current-cloud-backend dir */
  const amplifyMeta = {
    providers: {
      awscloudformation: teamProviderInfo[defaultEnvironment].awscloudformation
    }
  };
  if (!fs.existsSync(AMPLIFY_PATH + '/#current-cloud-backend')) {
    fs.mkdirSync(AMPLIFY_PATH + '/#current-cloud-backend');
  }
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/amplify-meta.json', amplifyMeta);
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/backend-config.json', {});
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/tags.json', TAGS);
  fs.copyFileSync(
    TEMPLATES_PATH + '/menu-planner-backend-root.yml',
    AMPLIFY_PATH + '/#current-cloud-backend/nested-cloudformation-stack.yml'
  );
  /** backend dir */
  if (!fs.existsSync(AMPLIFY_PATH + '/backend')) {
    fs.mkdirSync(AMPLIFY_PATH + '/backend');
  }
  writeJSONFile(AMPLIFY_PATH + '/backend/amplify-meta.json', amplifyMeta);
  writeJSONFile(AMPLIFY_PATH + '/backend/backend-config.json', {});
  writeJSONFile(AMPLIFY_PATH + '/backend/tags.json', TAGS);
  console.log(chalk.greenBright.bold('All local files updated'));
};

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
    readStringFile(TEMPLATES_PATH + '/menu-planner-amplify-app.yml')
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
    readStringFile(TEMPLATES_PATH + '/menu-planner-amplify-branch.yml')
  );
  console.log(chalk.greenBright.bold(`${branchName} branch created`));
};

createBackend = async params => {
  checkParameters(['appName', 'environment'], params);
  const { appName, environment } = params;
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
    }
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
    readStringFile(TEMPLATES_PATH + '/menu-planner-backend-root.yml')
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
}

createApp = async yargs => {
  try {
    const { src: sourceFile, profile, environment: defaultEnvironment } = yargs;
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    const params = readJSONFile(sourceFile);
    const { appId } = await createAmplifyApp(params);
    const teamProviderInfo = {};
    if (params.environments && params.environments.length > 0) {
      if (defaultEnvironment) {
        for (const environment of params.environments) {
          await createAmplifyBranch({
            appName: params.appName,
            appId: appId,
            branchName: environment.branch,
            environment: environment.environmentName
          });
          const backendData = await createBackend({
            appName: params.appName,
            environment: environment.environmentName
          });
          teamProviderInfo[environment.environmentName] = {
            awscloudformation: {
              ...backendData,
              AmplifyAppId: appId
            },
            categories: {}
          };
        }
        updateBackendFiles(teamProviderInfo, params.appName, defaultEnvironment, profile);
        await updateBucket(teamProviderInfo[defaultEnvironment].awscloudformation.DeploymentBucketName);
        console.log();
        console.log(chalk.greenBright.bold(`All resources created in the cloud`));
      }
      else {
        console.log(chalk.redBright.bold(
          'ERROR: You must define a default environment if an environments array is defined'
        ));
      }
    }
    else {
      console.log(chalk.greenBright.bold(`All resources created in the cloud`));
    }
  }
  catch (error) {
    console.log(chalk.redBright.bold('ERROR'), error);
  }
};

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