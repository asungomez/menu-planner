const {
  writeJSONFile,
  uploadFile,
  TEMPLATES_PATH,
  DATA_TEMPLATES_PATH,
  readJSONFile,
  LAMBDAS_PATH,
  zipFiles
} = require('../utils');
const fs = require('fs');
const chalk = require("chalk");

const uploadLambdaFunction = async (name, bucket, appName) => {
  console.log();
  console.log(chalk.magentaBright.bold(`Uploading ${name} lambda function to bucket`));
  console.log('This operation can take some minutes');
  const lambdaFiles = fs.readdirSync(LAMBDAS_PATH + '/' + name);
  const filesToZip = lambdaFiles
    .filter(file => !file.includes('node_modules'))
    .map(file =>  `${LAMBDAS_PATH}/${name}/${file}`);
  const zipFileName = `${LAMBDAS_PATH}/${name}/build.zip`;
  await zipFiles(filesToZip, zipFileName);
  await uploadFile(
    bucket,
    zipFileName,
    `amplify-builds/${appName}-lambda-${name}-build.zip`
  );
  fs.unlinkSync(zipFileName);
  console.log(chalk.greenBright.bold(`${name} lambda function uploaded to bucket`));
};

const uploadLambdas = async (bucket, appName) => {
  await uploadLambdaFunction('custom-message', bucket, appName);
};

const createAmplifyConfig = (appPath, environmentData, authData) => {
  if (!fs.existsSync(`${appPath}/${environmentData.name}`)) {
    fs.mkdirSync(`${appPath}/${environmentData.name}`);
  }
  const oauthMetadata = JSON.parse(authData.OAuthMetadata);
  const awsMobile = {
    "aws_project_region": environmentData.backendData.Region,
    "aws_cognito_region": environmentData.backendData.Region,
    "aws_user_pools_id": authData.UserPoolId,
    "aws_user_pools_web_client_id": authData.AppClientIDWeb,
    "oauth": {
      "domain": null,
      "scope": oauthMetadata.AllowedOAuthScopes,
      "redirectSignIn": oauthMetadata.CallbackURLs[0],
      "redirectSignOut": oauthMetadata.LogoutURLs[0],
      "responseType": "token"
    },
    "federationTarget": "COGNITO_USER_POOLS"
  };
  writeJSONFile(`${appPath}/${environmentData.name}/aws-config.json`, awsMobile);
};


const uploadTemplates = async bucketName => {
  console.log();
  console.log(chalk.magentaBright.bold(`Uploading templates to deployment bucket`));
  console.log('This operation can take some minutes');
  await uploadFile(
    bucketName,
    TEMPLATES_PATH + '/backend-root-complete.yml',
    'nested-cloudformation-stack.yml'
  );
  await uploadFile(
    bucketName,
    TEMPLATES_PATH + '/backend-auth.yml',
    'amplify-cfn-templates/auth/backend-auth.yml'
  );
  await uploadFile(
    bucketName,
    TEMPLATES_PATH + '/backend-lambda-custom-message.yml',
    'amplify-cfn-templates/lambda/backend-lambda-custom-message.yml'
  );
  console.log(chalk.greenBright.bold('All templates uploaded'));
};

const createDomainTemplate = async (appPath, subdomains) => {
  console.log();
  console.log(chalk.magentaBright.bold('Creating domain ClodFormation template'));
  const DOMAIN_TEMPLATE = readJSONFile(DATA_TEMPLATES_PATH + '/domain-template.json');
  DOMAIN_TEMPLATE['Resources']['AmplifyDomain']['Properties']['SubDomainSettings'] = subdomains;
  const domainFile = `${appPath}/domain-template.json`;
  writeJSONFile(domainFile, DOMAIN_TEMPLATE);
  console.log(chalk.greenBright.bold('Domain template created'));
  return domainFile;
};



exports.uploadTemplates = uploadTemplates;
exports.createAmplifyConfig = createAmplifyConfig;
exports.createDomainTemplate = createDomainTemplate;
exports.uploadLambdaFunction = uploadLambdaFunction;
exports.uploadLambdas = uploadLambdas;