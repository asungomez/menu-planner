const chalk = require("chalk");
const AWS = require("aws-sdk");
const fs = require('fs');
const { deleteStack, emptyBucket, readJSONFile, getFileDir } = require("../utils");

const deleteApp = async yargs => {
  try {
    const { src: sourceFile, profile } = yargs;
    const { environments, appName, domain } = readJSONFile(sourceFile);
    const appPath = getFileDir(sourceFile);

    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });

    console.log();
    console.log(chalk.magentaBright.bold(`Deleting ${domain} domain`));
    console.log('This operation can take some minutes');
    const normalizedDomainName = domain.replace(/[\W_]+/g, '');
    const domainStackName = `${appName}-amplify-domain-${normalizedDomainName}`;
    await deleteStack(domainStackName);
    console.log(chalk.greenBright.bold(`${domain} domain deleted`));

    for (const { environmentName, branch } of environments) {
      console.log();
      console.log(chalk.magentaBright.bold(`Deleting ${branch} branch`));
      console.log('This operation can take some minutes');
      const branchStackName = `${appName}-amplify-branch-${branch}`;
      await deleteStack(branchStackName);
      console.log(chalk.greenBright.bold(`${branch} branch deleted`));

      console.log();
      console.log(chalk.magentaBright.bold(`Emptying development bucket`));
      console.log('This operation can take some minutes');
      const bucket = `${appName}-bucket-deployment-${environmentName}`;
      await emptyBucket(bucket);
      console.log(chalk.greenBright.bold(`Development bucket emptied`));

      console.log();
      console.log(chalk.magentaBright.bold(`Deleting ${environmentName} backend environment`));
      console.log('This operation can take some minutes');
      const backendStackName = `${appName}-amplify-backend-${environmentName}`;
      await deleteStack(backendStackName);
      console.log(chalk.greenBright.bold(`${environmentName} backend environment deleted`));

      console.log();
      console.log(chalk.magentaBright.bold(`Deleting environment ${environmentName} local files`));
      fs.unlinkSync(`${appPath}/${environmentName}/aws-config.json`);
      fs.unlinkSync(`${appPath}/${environmentName}/amplify-branch-params.json`);
      fs.unlinkSync(`${appPath}/${environmentName}/backend-root-params.json`);
      fs.rmdirSync(`${appPath}/${environmentName}`);
      console.log(chalk.greenBright.bold(`Environment ${environmentName} local files deleted`));
    }

    console.log();
    console.log(chalk.magentaBright.bold(`Deleting ${appName} app`));
    console.log('This operation can take some minutes');
    const appStackName = `${appName}-amplify-app`;
    await deleteStack(appStackName);
    console.log(chalk.greenBright.bold(`All resources deleted in the cloud`));

    console.log();
    console.log(chalk.magentaBright.bold(`Deleting local files`));
    fs.unlinkSync(`${appPath}/domain-template.json`);
    fs.unlinkSync(`${appPath}/domain-params.json`);
    fs.unlinkSync(`${appPath}/amplify-app-params.json`);
    console.log(chalk.greenBright.bold(`Local files deleted`));

    console.log(chalk.greenBright.bold(`App successfully removed`));
  }
  catch (error) {
    console.log(chalk.redBright.bold('ERROR'), error);
  }
};

exports.deleteApp = deleteApp;