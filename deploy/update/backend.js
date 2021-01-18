const { 
  APPS_SPEC_PATH, 
  TEMPLATES_PATH, 
  readJSONFile, 
  updateStack,
  readStringFile
} = require("../utils");
const chalk = require("chalk");
const AWS = require("aws-sdk");

const updateBackend = async yargs => {
  const { profile, alias: appAlias, environment } = yargs;
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
  const { 
    appName
  } = readJSONFile(sourceFile);

  console.log();
  console.log(chalk.magentaBright.bold(`Updating ${environment} environment`));
  console.log('This operation can take some minutes');
  const stackTemplate = readStringFile(`${TEMPLATES_PATH}/backend-root-complete.yml`);
  const parameters = readJSONFile(`${APPS_SPEC_PATH}/${appAlias}/${environment}/backend-root-params.json`);
  const stackName = `${appName}-amplify-backend-${environment}`;
  await updateStack(stackName, ['CAPABILITY_NAMED_IAM'], parameters, null, stackTemplate);
  console.log(chalk.greenBright.bold(`${environment} environment updated`));
};

exports.updateBackend = updateBackend;