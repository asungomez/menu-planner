const {
  zipFiles,
  readJSONFile,
  writeJSONFile,
  uploadFile,
  TEMPLATES_PATH,
  AMPLIFY_PATH,
  DATA_TEMPLATES_PATH
} = require('../utils');
const fs = require('fs');
const path = require('path')
const chalk = require("chalk");;

const uploadEnvironmentFiles = async bucketName => {
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
  fs.unlinkSync(AMPLIFY_PATH + '/#current-cloud-backend/current-cloud-backend.zip');
  console.log(chalk.greenBright.bold('All files uploaded'));
};

const createEnvironmentFiles = (environmentData, authData, appId, appName) => {
  const TAGS = readJSONFile(DATA_TEMPLATES_PATH + '/tags.json');
  const AMPLIFY_META_AUTH = readJSONFile(DATA_TEMPLATES_PATH + '/amplify-meta-auth.json');
  const BACKEND_CONFIG_AUTH = readJSONFile(DATA_TEMPLATES_PATH + '/backend-config-auth.json');
  const AUTH_PARAMETERS = readJSONFile(DATA_TEMPLATES_PATH + '/auth-parameters.json');

  const { name: environmentName, backendData } = environmentData;
  const { name: authName } = authData;

  console.log();
  console.log(chalk.magentaBright.bold(`Creating environment ${environmentName} local files`));

  if (!fs.existsSync(AMPLIFY_PATH)) {
    fs.mkdirSync(AMPLIFY_PATH);
  }

  /** 
   * #current-cloud-backend directory 
   * It contains files not tracked by git with information about the currently
   * checked-out environment. These files will be in sync with the deployment
   * bucket.
   */
  if (!fs.existsSync(AMPLIFY_PATH + '/#current-cloud-backend')) {
    fs.mkdirSync(AMPLIFY_PATH + '/#current-cloud-backend');
  }

  // amplify-meta.json
  AMPLIFY_META_AUTH['providerMetadata']['s3TemplateURL'] = authData.TemplateURL;
  AMPLIFY_META_AUTH['providerMetadata']['logicalId'] = 'Auth';
  AMPLIFY_META_AUTH['output'] = { ...authData };
  delete AMPLIFY_META_AUTH.output.name;
  const amplifyMeta = {
    providers: {
      awscloudformation: {
        ...backendData,
        AmplifyAppId: appId
      }
    },
    auth: {
      [authName]: AMPLIFY_META_AUTH
    }
  };
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/amplify-meta.json', amplifyMeta);

  const backendConfigData = {
    auth: {
      [authName]: BACKEND_CONFIG_AUTH
    }
  };
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/backend-config.json', backendConfigData);

  // tags.json
  writeJSONFile(AMPLIFY_PATH + '/#current-cloud-backend/tags.json', TAGS);

  // nested-cloudformation-stack.yml
  fs.copyFileSync(
    TEMPLATES_PATH + '/backend-root-with-auth.yml',
    AMPLIFY_PATH + '/#current-cloud-backend/nested-cloudformation-stack.yml'
  );

  /**
   * auth directory
   * Authentication-related specs for current environment
   */
  if (!fs.existsSync(AMPLIFY_PATH + '/#current-cloud-backend/auth')) {
    fs.mkdirSync(AMPLIFY_PATH + '/#current-cloud-backend/auth');
  }
  if (!fs.existsSync(AMPLIFY_PATH + '/#current-cloud-backend/auth/' + authName)) {
    fs.mkdirSync(AMPLIFY_PATH + '/#current-cloud-backend/auth/' + authName);
  }

  // cloudformation-template.yml
  fs.copyFileSync(
    TEMPLATES_PATH + '/backend-auth.yml',
    AMPLIFY_PATH + `/#current-cloud-backend/auth/${authName}/${authName}-cloudformation-template.yml`
  );

  // parameters.json
  AUTH_PARAMETERS['appName'] = appName;
  AUTH_PARAMETERS['resourceNameTruncated'] = appName.split('-')[0];
  AUTH_PARAMETERS['env'] = environmentName;
  writeJSONFile(AMPLIFY_PATH + `/#current-cloud-backend/auth/${authName}/parameters.json`, AUTH_PARAMETERS);

  /**
   * backend directory
   * It contains the current backend implementation.
   */
  if (!fs.existsSync(AMPLIFY_PATH + '/backend')) {
    fs.mkdirSync(AMPLIFY_PATH + '/backend');
  }

  // amplify-meta.json
  writeJSONFile(AMPLIFY_PATH + '/backend/amplify-meta.json', amplifyMeta);

  // backend-config.json TODO fill with real data
  writeJSONFile(AMPLIFY_PATH + '/backend/backend-config.json', backendConfigData);

  // tags.json
  writeJSONFile(AMPLIFY_PATH + '/backend/tags.json', TAGS);

  // nested-cloudformation-stack.yml
  if (!fs.existsSync(AMPLIFY_PATH + '/backend/awscloudformation')) {
    fs.mkdirSync(AMPLIFY_PATH + '/backend/awscloudformation');
  }
  fs.copyFileSync(
    TEMPLATES_PATH + '/backend-root-with-auth.yml',
    AMPLIFY_PATH + '/backend/awscloudformation/nested-cloudformation-stack.yml'
  );

  /**
   * auth directory
   * Authentication-related code
   */
  if (!fs.existsSync(AMPLIFY_PATH + '/backend/auth')) {
    fs.mkdirSync(AMPLIFY_PATH + '/backend/auth');
  }
  if (!fs.existsSync(AMPLIFY_PATH + '/backend/auth/' + authName)) {
    fs.mkdirSync(AMPLIFY_PATH + '/backend/auth/' + authName);
  }
  // cloudformation-template.yml
  fs.copyFileSync(
    TEMPLATES_PATH + '/backend-auth.yml',
    AMPLIFY_PATH + `/backend/auth/${authName}/${authName}-cloudformation-template.yml`
  );

  // parameters.json
  writeJSONFile(AMPLIFY_PATH + `/backend/auth/${authName}/parameters.json`, AUTH_PARAMETERS);

  console.log(chalk.greenBright.bold(`Environment ${environmentName} local files created`));
};

const updateCommonFiles = (environmentData, authData, appName, appId, profile, defaultEnvironment) => {
  const { name: environmentName, backendData } = environmentData;
  const { name: authName } = authData;

  console.log();
  console.log(chalk.magentaBright.bold(`Updating common local files with environment ${environmentName}`));

  const PROJECT_CONFIG = readJSONFile(DATA_TEMPLATES_PATH + '/project-config.json');
  const LOCAL_AWS_INFO = readJSONFile(DATA_TEMPLATES_PATH + '/local-aws-info.json');
  const LOCAL_ENV_INFO = readJSONFile(DATA_TEMPLATES_PATH + '/local-env-info.json');

  /**
   * Root directory files
   */
  if (!fs.existsSync(AMPLIFY_PATH)) {
    fs.mkdirSync(AMPLIFY_PATH);
  }

  // team-provider-info.json
  if (!fs.existsSync(AMPLIFY_PATH + '/team-provider-info.json')) {
    writeJSONFile(AMPLIFY_PATH + '/team-provider-info.json', {});
  }
  const previousTeamProviderInfo = readJSONFile(AMPLIFY_PATH + '/team-provider-info.json');
  const updatedTeamProviderInfo = {
    ...previousTeamProviderInfo,
    [environmentName]: {
      awscloudformation: {
        ...backendData,
        AmplifyAppId: appId
      },
      categories: {
        auth: {
          [authName]: {}
        }
      }
    }
  };
  writeJSONFile(AMPLIFY_PATH + '/team-provider-info.json', updatedTeamProviderInfo);

  // cli.json
  if (!fs.existsSync(AMPLIFY_PATH + '/cli.json')) {
    writeJSONFile(AMPLIFY_PATH + '/cli.json', { "features": {} });
  }

  /**
   * .config directory
   * It contains configuration files for both local and remote environments
   */
  if (!fs.existsSync(AMPLIFY_PATH + '/.config')) {
    fs.mkdirSync(AMPLIFY_PATH + '/.config');
  }

  // project-config.json
  if (!fs.existsSync(AMPLIFY_PATH + '/.config/project-config.json')) {
    PROJECT_CONFIG['projectName'] = appName;
    writeJSONFile(AMPLIFY_PATH + '/.config/project-config.json', PROJECT_CONFIG);
  }

  // local-aws-info.json
  if (!fs.existsSync(AMPLIFY_PATH + '/.config/local-aws-info.json')) {
    writeJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json', {});
  }
  const previousLocalAWSInfo = readJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json');
  const updatedLocalAWSInfo = {
    ...previousLocalAWSInfo,
    [environmentName]: {
      ...LOCAL_AWS_INFO,
      profileName: profile,
      AmplifyAppId: appId
    }
  };
  writeJSONFile(AMPLIFY_PATH + '/.config/local-aws-info.json', updatedLocalAWSInfo);

  // local-env-info.json
  const localDirectory = path.join(__dirname,).replace('/deploy/create', '');
  LOCAL_ENV_INFO['envName'] = defaultEnvironment;
  LOCAL_ENV_INFO['projectPath'] = localDirectory;
  writeJSONFile(AMPLIFY_PATH + '/.config/local-env-info.json', LOCAL_ENV_INFO);

  console.log(chalk.greenBright.bold('Common local files updated'));
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

exports.uploadEnvironmentFiles = uploadEnvironmentFiles;
exports.createEnvironmentFiles = createEnvironmentFiles;
exports.updateCommonFiles = updateCommonFiles;
exports.uploadTemplates = uploadTemplates;