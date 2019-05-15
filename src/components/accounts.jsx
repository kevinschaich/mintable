import '../styles/style.scss'
import PlaidLink from 'react-plaid-link'
import React from 'react'
import Account from './account'
import { fetch } from './helpers'
import Link from 'next/link'

class Accounts extends React.Component {
  constructor(props) {
    super(props)
    this.state = { currentAccountNickname: '', accounts: false }
  }

  componentDidMount = async () => {
    if (this.props.config.PLAID_ENVIRONMENT && this.props.config.PLAID_PUBLIC_KEY) {
      this.setState({ accounts: await fetch(`http://${process.env.HOST}:${process.env.PORT}/balances`) })
    }
  }

  handleOnNewAccountNameChange = e => {
    this.setState({ currentAccountNickname: e.currentTarget.value })
  }

  handleOnSuccess = (public_token, metadata) => {
    if (!public_token) {
      return
    }
    const body = {
      public_token,
      accountNickname: this.state.currentAccountNickname
    }
    fetch(`http://${process.env.HOST}:${process.env.PORT}/token`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  handleOnUpdateAccountResponse = (data, nickname) => {
    this.setState({ currentAccountNickname: nickname }, () =>
      window.Plaid.create({
        clientName: 'Mintable',
        env: this.props.config.PLAID_ENVIRONMENT,
        product: ['auth', 'transactions'],
        key: this.props.config.PLAID_PUBLIC_KEY,
        onExit: this.handleOnExit,
        onSuccess: this.handleOnSuccess,
        token: data
      }).open()
    )
  }

  render = () => {
    let accountsList, newAccountSetup

    // If there are no accounts, display loading message
    if (!this.state.accounts) {
      accountsList = null
    }
    // Render accounts
    else if (this.state.accounts && this.state.accounts.length > 0) {
      accountsList = (
        <div>
          <h3>Current Accounts</h3>
          <span>
            <strong>Note</strong>: In the Plaid Development environment, removing an item will not decrement your live
            credential count.
          </span>
          <div className='accounts-list'>
            {this.state.accounts.map(account => (
              <Account
                details={account}
                key={account.nickname}
                handleOnUpdateAccountResponse={this.handleOnUpdateAccountResponse}
              />
            ))}
          </div>
        </div>
      )
    }

    if (this.props.config.PLAID_ENVIRONMENT && this.props.config.PLAID_PUBLIC_KEY) {
      newAccountSetup = (
        <div>
          <h3>Add a New Account</h3>
          <div>
            Mintable uses nicknames like 'Chase' or 'Discover' to refer to accounts. Enter a nickname to add a new
            account:
          </div>
          <div className='new-account'>
            <input
              id='new-account-name'
              name='new-account-name'
              placeholder='New Account Nickname'
              onChange={this.handleOnNewAccountNameChange}
            />
            <PlaidLink
              clientName='Mintable'
              env={this.props.config.PLAID_ENVIRONMENT}
              product={['auth', 'transactions']}
              publicKey={this.props.config.PLAID_PUBLIC_KEY}
              onSuccess={this.handleOnSuccess}
              style={{
                background: '#137cbd',
                display: this.state.currentAccountNickname ? 'flex' : 'none'
              }}
            >
              Add New Account
            </PlaidLink>
          </div>
        </div>
      )
    } else {
      newAccountSetup = (
        <div>
          You need to setup your <Link href='/account-provider-setup'>account provider</Link> before adding accounts
          here.
        </div>
      )
    }

    return (
      <div className='accounts'>
        {accountsList}
        {newAccountSetup}
      </div>
    )
  }
}

export default Accounts
