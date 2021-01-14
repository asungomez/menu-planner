const environment = process.REACT_APP_ENVIRONMENT || 'dev';
const account = process.REACT_APP_ACCOUNT || 'dev';
const awsmobile = require(`../iac/apps/${account}/${environment}/aws-config.json`);

export default awsmobile;
