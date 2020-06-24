#!/usr/bin/env node

import chalk from 'chalk'

;(async function() {
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
        migrate: ['./migrate.js'],
        fetch: ['./fetch.js'],
        'plaid-setup': ['../integrations/plaid/setup.js'],
        'account-setup': ['../integrations/plaid/add.js'],
        'google-setup': ['../integrations/google/setup.js']
    }

    const arg = process.argv[2]

    if (arg == 'setup') {
        await require('../integrations/plaid/setup.js').default()
        await require('../integrations/google/setup.js').default()
    } else if (commands.hasOwnProperty(arg)) {
        commands[arg].forEach(command => require(command).default())
    } else {
        console.log('\nusage: mintable <command>\n')
        console.log('available commands:')
        Object.keys(commands)
            .concat(['setup'])
            .forEach(command => console.log(`\t${command}`))
    }
})()
