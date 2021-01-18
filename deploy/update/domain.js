const { 
  APPS_SPEC_PATH,
  readJSONFile, 
  updateStack,
  readStringFile
} = require("../utils");
const chalk = require("chalk");
const AWS = require("aws-sdk");

const updateDomain = async yargs => {
  const { profile, alias: appAlias } = yargs;
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  const sourceFile = `${APPS_SPEC_PATH}/${appAlias}/app-params.json`;
  const { 
    appName,
    domain
  } = readJSONFile(sourceFile);

  console.log();
  console.log(chalk.magentaBright.bold(`Updating ${domain} domain`));
  console.log('This operation can take some minutes');

  const stackTemplate = readStringFile(`${APPS_SPEC_PATH}/${appAlias}/domain-template.json`);
  const parameters = readJSONFile(`${APPS_SPEC_PATH}/${appAlias}/domain-params.json`);
  const normalizedDomainName = domain.replace(/[\W_]+/g, '');
  const stackName = `${appName}-amplify-domain-${normalizedDomainName}`;
  await updateStack(stackName, [], parameters, null, stackTemplate);
  console.log(chalk.greenBright.bold(`${domain} domain updated`));
};

exports.updateDomain = updateDomain;