const AWS = require("aws-sdk");
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const chalk = require("chalk");

const TEMPLATES_PATH = path.join(__dirname, '..', '..', 'iac', 'templates');
const DATA_TEMPLATES_PATH = path.join(__dirname, '..', 'data_templates');
const APPS_SPEC_PATH = path.join(__dirname, '..', '..', 'iac', 'apps');
const LAMBDAS_PATH = path.join(__dirname, '..', '..', 'lambda');

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
  const timestamp = (new Date()).getTime();
  const s3Key = `amplify-builds/${appName}-lambda-${name}-${timestamp}-build.zip`;
  await uploadFile(
    bucket,
    zipFileName,
    s3Key
  );
  fs.unlinkSync(zipFileName);
  console.log(chalk.greenBright.bold(`${name} lambda function uploaded to bucket`));
  return s3Key;
};

const getFileDir = filePath => {
  const filePathParts = filePath.split('/');
  const dirPath = filePathParts.slice(0, filePathParts.length - 1).join('/');
  return dirPath;
};

const readJSONFile = (fileName) => {
  const rawData = fs.readFileSync(fileName);
  return JSON.parse(rawData);
};

const writeJSONFile = (fileName, data) => {
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
};

const readStringFile = (fileName) => {
  return fs.readFileSync(fileName).toString();
};

const writeStringFile = (fileName, content) => {
  fs.writeFileSync(fileName, content);
}

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
      if (error) {
        reject(error);
      }
      else {
        resolve();
      }
    });
  });
};

const emptyBucket = async bucket => {
  const s3 = new AWS.S3({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  return new Promise(async (resolve, reject) => {
    try {
      const { Contents: contents } = await s3.listObjects({ Bucket: bucket }).promise();
      if (contents.length > 0) {
        await s3
          .deleteObjects({
            Bucket: bucket,
            Delete: {
              Objects: contents.map(({ Key }) => ({ Key }))
            }
          })
          .promise();
        resolve();
      }
    }
    catch (error) {
      reject(error);
    }
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

const updateStack = (stackName, capabilities, parameters, tags, template) => {
  const cloudFormation = new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  return new Promise((resolve, reject) => {
    cloudFormation.updateStack({
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
        cloudFormation.waitFor('stackUpdateComplete', { StackName: stackName }, (error, waitData) => {
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

const getStackOutput = (stackName) => {
  const cloudFormation = new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  const params = {
    StackName: stackName
  };
  return new Promise((resolve, reject) => {
    cloudFormation.describeStacks(params, (error, data) => {
      if (error) {
        reject(error);
      }
      else {
        const stack = data.Stacks[0];

        const statuses = [
          'CREATE_COMPLETE',
          'UPDATE_COMPLETE',
          'UPDATE_ROLLBACK_COMPLETE'
        ];

        if (statuses.indexOf(stack.StackStatus) === -1) {
          reject(new Error('Unable to get outputs for a stack "'
            + stackName + '" in state "' + stack.StackStatus
            + '", aborting.'));
        }

        const outputs = {};
        stack.Outputs.forEach((output) => {
          outputs[output.OutputKey] = output.OutputValue;
        });

        resolve(outputs);
      }
    });
  });
}

const deleteStack = async stackName => {
  const cloudFormation = new AWS.CloudFormation({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  const params = {
    StackName: stackName
  };
  return new Promise((resolve, reject) => {
    cloudFormation.deleteStack(params, (error) => {
      if (error) {
        reject(error);
      }
      else {
        cloudFormation.waitFor('stackDeleteComplete', params, (error) => {
          if (error) {
            reject(error);
          }
          else {
            resolve();
          }
        });
      }
    });
  });
};

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

const uploadLambdas = async (bucket, appName) => {
  const s3Keys = {};
  s3Keys['custom-message'] = await uploadLambdaFunction('custom-message', bucket, appName);
  return s3Keys;
};

const deleteLambdas = async (bucket) => {
  const s3 = new AWS.S3({
    apiVersion: '2010-05-15',
    region: 'us-east-2',
  });
  return new Promise(async (resolve, reject) => {
    try {
      const { Contents: contents } = await s3.listObjects({ 
        Bucket: bucket,
        Prefix: 'amplify-builds/'
       }).promise();
      if (contents.length > 0) {
        await s3
          .deleteObjects({
            Bucket: bucket,
            Delete: {
              Objects: contents.map(({ Key }) => ({ Key }))
            }
          })
          .promise();
        resolve();
      }
    }
    catch (error) {
      reject(error);
    }
  });
};

const updateRootBackend = async (stackName, lambdaS3Keys) => {
  const parameters = [
    {
      "ParameterKey": "DeploymentBucketName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "AuthRoleName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "UnauthRoleName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "AppName",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "Environment",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "AppUrl",
      "UsePreviousValue": true
    },
    {
      "ParameterKey": "CustomMessageFunctionS3Key",
      "ParameterValue": lambdaS3Keys['custom-message']
    }
  ];
  const { outputs } = await updateStack(
    stackName,
    ['CAPABILITY_NAMED_IAM'],
    parameters,
    null,
    readStringFile(TEMPLATES_PATH + '/backend-root-complete.yml')
  );
  return outputs;
};

exports.deleteLambdas = deleteLambdas;
exports.updateRootBackend = updateRootBackend;
exports.uploadLambdas = uploadLambdas;
exports.readJSONFile = readJSONFile;
exports.writeJSONFile = writeJSONFile;
exports.readStringFile = readStringFile;
exports.writeStringFile = writeStringFile;
exports.checkParameters = checkParameters;
exports.getOutputValue = getOutputValue;
exports.uploadFile = uploadFile;
exports.createStack = createStack;
exports.updateStack = updateStack;
exports.getStackOutput = getStackOutput;
exports.deleteStack = deleteStack;
exports.emptyBucket = emptyBucket;
exports.getFileDir = getFileDir;
exports.zipFiles = zipFiles;
exports.uploadLambdaFunction = uploadLambdaFunction;
exports.TEMPLATES_PATH = TEMPLATES_PATH;
exports.DATA_TEMPLATES_PATH = DATA_TEMPLATES_PATH;
exports.APPS_SPEC_PATH = APPS_SPEC_PATH;
exports.LAMBDAS_PATH = LAMBDAS_PATH;