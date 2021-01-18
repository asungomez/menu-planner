const { 
  APPS_SPEC_PATH, 
  TEMPLATES_PATH, 
  readJSONFile, 
  updateStack,
  readStringFile
} = require("../utils");
const chalk = require("chalk");
const AWS = require("aws-sdk");

const updateApp = async yargs => {
  const { profile, alias: appAlias, token } = yargs;
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
  const { 
    appName,
  } = readJSONFile(sourceFile);

  console.log();
  console.log(chalk.magentaBright.bold(`Updating ${appName} Amplify app`));
  console.log('This operation can take some minutes');

  const stackTemplate = readStringFile(`${TEMPLATES_PATH}/amplify-app.yml`);
  const parameters = readJSONFile(`${APPS_SPEC_PATH}/${appAlias}/amplify-app-params.json`);

  const tokenParameterIndex = parameters.findIndex(parameter => parameter['ParameterKey'] === 'GithubToken');
  if(token) {
    parameters[tokenParameterIndex]['ParameterValue'] = token;
  }
  else {
    delete parameters[tokenParameterIndex]['ParameterValue'];
    parameters[tokenParameterIndex]['UsePreviousValue'] = true;
  }
  const stackName = `${appName}-amplify-app`;
  await updateStack(stackName, ['CAPABILITY_NAMED_IAM'], parameters, null, stackTemplate);
  console.log(chalk.greenBright.bold(`${appName} Amplify app updated`));
};

exports.updateApp = updateApp;