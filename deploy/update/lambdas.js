const AWS = require("aws-sdk");
const chalk = require("chalk");
const {
  uploadLambdas, 
  readJSONFile, 
  updateRootBackend, 
  deleteLambdas, 
  APPS_SPEC_PATH 
} = require("../utils");

const deployLambdas = async yargs => {
  const { profile, alias: appAlias, environment } = yargs;
  const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  const { 
    appName,
  } = readJSONFile(sourceFile);
  const bucket = `${appName}-bucket-deployment-${environment}`;
  await deleteLambdas(bucket);
  const lambdaS3Keys = await uploadLambdas(bucket, appName);
  const stackName = `${appName}-amplify-backend-${environment}`;
  console.log();
  console.log(chalk.magentaBright.bold(`Updating ${environment} stack`));
  console.log('This operation can take some minutes');
  await updateRootBackend(stackName, lambdaS3Keys);
  console.log(chalk.greenBright.bold(`${environment} stack updated`));
};

exports.deployLambdas = deployLambdas;