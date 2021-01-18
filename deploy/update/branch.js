const { 
  APPS_SPEC_PATH, 
  TEMPLATES_PATH, 
  readJSONFile, 
  updateStack,
  readStringFile
} = require("../utils");
const chalk = require("chalk");
const AWS = require("aws-sdk");

const updateBranch = async yargs => {
  const { profile, alias: appAlias, environment } = yargs;
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
  const { 
    appName,
    environments
  } = readJSONFile(sourceFile);

  console.log();
  console.log(chalk.magentaBright.bold(`Updating ${environment} environment branch`));
  console.log('This operation can take some minutes');

  const stackTemplate = readStringFile(`${TEMPLATES_PATH}/amplify-branch.yml`);
  const parameters = readJSONFile(`${APPS_SPEC_PATH}/${appAlias}/${environment}/amplify-branch-params.json`);
  const environmentIndex = environments.findIndex(environmentDefinition => environmentDefinition['environmentName'] === environment);
  const branchName = environments[environmentIndex]['branch'];
  const stackName = `${appName}-amplify-branch-${branchName}`;

  await updateStack(stackName, [], parameters, null, stackTemplate);
  console.log(chalk.greenBright.bold(`${environment} environment branch updated`));
};

exports.updateBranch = updateBranch;