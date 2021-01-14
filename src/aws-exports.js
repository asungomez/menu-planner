const environment = process.REACT_APP_ENVIRONMENT || 'dev';
const awsmobile = require('../iac/apps/'+environment+'/aws-config.json');

export default awsmobile;
