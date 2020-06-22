#!/usr/bin/env node

require('ts-node').register()
const chalk = require('chalk')

const logo = [
    '\n',
    '          %',
    '          %%',
    '         %%%%%',
    '       %%%%%%%%',
    '     %%%%%%%%%%',
    '   %%%%%%%%%%%%',
    '  %%%% %%%%%%%%',
    '  %%%  %%%%%%',
    '  %%   %%%%%%',
    '   %   %%%',
    '        %%%',
    '         %%',
    '           %',
    '\n'
]

logo.forEach(line => {
    console.log(chalk.green(line))
})

console.log(' M I N T A B L E\n')

const commands = {
    migrate: './src/scripts/migrate.ts',
    fetch: './src/scripts/fetch.ts',
    setup: './src/scripts/setup.ts',
    'plaid-setup': './src/integrations/plaid/setup.ts',
    'account-setup': './src/integrations/plaid/add.ts',
    'google-setup': './src/integrations/google/setup.ts'
}

const command = process.argv[2]

if (commands.hasOwnProperty(command)) {
    require(commands[command])
} else {
    console.log('\nusage: mintable <command>\n')
    console.log('Available commands:')
    Object.keys(commands).forEach(command => {
        console.log(`\t${command}`)
    })
}
