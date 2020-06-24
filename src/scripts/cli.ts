#!/usr/bin/env node

const chalk = require('chalk')
import { updateConfig } from '../common/config'
import plaid from '../integrations/plaid/setup'
import google from '../integrations/google/setup'
import add from '../integrations/plaid/add'
import fetch from './fetch'
import migrate from './migrate'
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
        migrate: migrate,
        fetch: fetch,
        'plaid-setup': plaid,
        'account-setup': add,
        'google-setup': google
    }

    const arg = process.argv[2]

    if (arg == 'setup') {
        updateConfig(config => config, true)
        await plaid()
        await google()
        await add()
    } else if (commands.hasOwnProperty(arg)) {
        commands[arg]()
    } else {
        console.log(`\nmintable v${require('../../package.json').version}\n`)
        console.log('\nusage: mintable <command>\n')
        console.log('available commands:')
        Object.keys(commands)
            .concat(['setup'])
            .forEach(command => console.log(`\t${command}`))
    }
})()
