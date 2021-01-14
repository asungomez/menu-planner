const AWS = require("aws-sdk");
const fs = require('fs');
const path = require('path');

const TEMPLATES_PATH = path.join(__dirname, '..', '..', 'iac', 'templates');
const DATA_TEMPLATES_PATH = path.join(__dirname, '..', 'data_templates');
const AMPLIFY_PATH = path.join(__dirname, '..', '..', 'amplify');
const SOURCE_CODE_PATH = path.join(__dirname, '..', '..', 'src');
const APPS_SPEC_PATH = path.join(__dirname, '..', '..', 'iac', 'apps');

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
  fs.writeFileSync(fileName, JSON.stringify(data));
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
exports.TEMPLATES_PATH = TEMPLATES_PATH;
exports.DATA_TEMPLATES_PATH = DATA_TEMPLATES_PATH;
exports.AMPLIFY_PATH = AMPLIFY_PATH;
exports.SOURCE_CODE_PATH = SOURCE_CODE_PATH;
exports.APPS_SPEC_PATH = APPS_SPEC_PATH;