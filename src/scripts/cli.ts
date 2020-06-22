import { fork } from 'child_process'

switch(process.argv[1]){
    case "migrate":
        fork("ts-node ./src/scripts/migrate.ts")
        break
    case "fetch":
        fork("ts-node ./src/scripts/fetch.ts")
        break
    case "setup":
        fork("ts-node ./src/scripts/setup.ts")
        break
    case "setup-plaid":
        fork("ts-node ./src/integrations/plaid/setup.ts")
        break
    case "setup-plaid-account":
        fork("ts-node ./src/integrations/plaid/add.ts")
        break
    case "setup-google":
        fork("ts-node ./src/integrations/google/setup.ts")
        break
    default:
        break
}
