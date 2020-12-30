app=$1
environment=$2
aws cloudformation create-stack --stack-name menu-planner-$app-amplify-branch-$environment --template-body file://../templates/menu-planner-amplify-branch.yml --parameters file://../apps/$app/deployments/$environment/menu-planner-amplify-branch-params.json --profile personal-admin