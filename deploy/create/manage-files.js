const {
  writeJSONFile,
  uploadFile,
  APPS_SPEC_PATH,
  TEMPLATES_PATH
} = require('../utils');
const fs = require('fs');
const chalk = require("chalk");

const createAmplifyConfig = (environmentData, authData) => {
  if (!fs.existsSync(`${APPS_SPEC_PATH}/${environmentData.name}`)) {
    fs.mkdirSync(`${APPS_SPEC_PATH}/${environmentData.name}`);
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
  writeJSONFile(`${APPS_SPEC_PATH}/${environmentData.name}/aws-config.json`, awsMobile);
};


const uploadTemplates = async bucketName => {
  console.log();
  console.log(chalk.magentaBright.bold(`Uploading templates to deployment bucket`));
  console.log('This operation can take some minutes');
  await uploadFile(
    bucketName,
    TEMPLATES_PATH + '/backend-root-with-auth.yml',
    'nested-cloudformation-stack.yml'
  );
  await uploadFile(
    bucketName,
    TEMPLATES_PATH + '/backend-auth.yml',
    'amplify-cfn-templates/auth/backend-auth.yml'
  );
  console.log(chalk.greenBright.bold('All templates uploaded'));
};

exports.uploadTemplates = uploadTemplates;
exports.createAmplifyConfig = createAmplifyConfig;