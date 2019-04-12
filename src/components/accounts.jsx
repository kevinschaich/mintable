import '../styles/style.scss'
import PlaidLink from 'react-plaid-link'
import React from 'react'
import Account from './account'

class Accounts extends React.Component {
  constructor(props) {
    super(props)
    this.state = { newAccountNickname: '', accounts: false }
  }

  componentDidMount = async () => {
    this.setState({ accounts: await fetch('http://localhost:3000/balances') })
  }

  handleOnNewAccountNameChange = e => {
    this.setState({ newAccountNickname: e.currentTarget.value })
  }

  handleOnSuccess = (public_token, metadata) => {
    if (!public_token) {
      return
    }
    const body = {
      public_token,
      accountNickname: this.state.newAccountNickname
    }
    fetch('http://localhost:3000/token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  handleOnUpdateAccountResponse = data => {
    window.Plaid.create({
      clientName: 'Mintable',
      env: this.props.config.PLAID_ENVIRONMENT,
      product: ['auth', 'transactions'],
      key: this.props.config.PLAID_PUBLIC_KEY,
      onExit: this.handleOnExit,
      onSuccess: this.handleOnSuccess,
      token: data.public_token[0]
    }).open()
  }

  render = () => {
    let accounts

    if (this.state.accounts === false) {
      accounts = <span>Loading Accounts...</span>
    } else if (this.state.accounts && this.state.accounts.length > 0) {
      accounts = this.state.accounts.map(account => (
        <Account
          details={account}
          key={account.nickname}
          handleOnUpdateAccountResponse={this.handleOnUpdateAccountResponse}
        />
      ))
    } else {
      accounts = <span>No accounts set up yet. Type an account nickname below to add one.</span>
    }

    return (
      <div className='accounts'>
        <h1>Accounts</h1>
        <span>
          <strong>Note</strong>: In the Plaid Development environment, removing an item will not decrement your live
          credential count.
        </span>
        <div className='accounts-list'>{accounts}</div>
        <span>Enter a nickname to add a new account:</span>
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
              display: this.state.newAccountNickname ? 'flex' : 'none'
            }}
          >
            Add New Account
          </PlaidLink>
        </div>
      </div>
    )
  }
}

export default Accounts
