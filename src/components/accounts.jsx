import '../styles/style.scss'
import PlaidLink from 'react-plaid-link'
import React from 'react'
import Account from './account'

class Accounts extends React.Component {
  constructor(props) {
    super(props)
    this.state = { newAccountNickname: '', accounts: [] }
  }

  componentDidMount = async () => {
    const accounts = await fetch('http://localhost:3000/balances')
    this.setState({ accounts: await accounts.json() })
  }

  handleOnNewAccountNameChange = e => {
    this.setState({ newAccountNickname: e.currentTarget.value })
  }

  handleOnSuccess = (publicToken, metadata) => {
    if (!publicToken) {
      return
    }
    const body = {
      publicToken,
      accountNickname: this.state.newAccountNickname
    }
    console.log(`Public Token:`, body)
    fetch('http://localhost:3000/token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(resp => {
        if (resp.status === 201) {
          console.log('Saved access token.')
        }
      })
      .catch(error => console.log(error))
  }

  handleOnUpdateAccountResponse = data => {
    window.Plaid.create({
      clientName: 'Mintable',
      env: 'development',
      product: ['auth', 'transactions'],
      key: this.props.config.PLAID_PUBLIC_KEY,
      onExit: this.handleOnExit,
      onSuccess: this.handleOnSuccess,
      token: data.publicToken[0]
    }).open()
  }

  handleOnExit = () => {
    console.log('Plaid authentication cancelled.')
  }

  render = () => {
    const accounts = this.state.accounts.map(account => (
      <Account
        details={account}
        key={account.nickname}
        handleOnUpdateAccountResponse={this.handleOnUpdateAccountResponse}
      />
    ))

    return (
      <div className='accounts'>
        <h1>Accounts</h1>
        <span>
          <strong>Note</strong>: In the Plaid Development environment, removing an item will not decrement your live
          credential count.
        </span>
        <div className='accounts-list'>{accounts.length ? accounts : <span>Loading...</span>}</div>
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
            env='development'
            product={['auth', 'transactions']}
            publicKey={this.props.config.PLAID_PUBLIC_KEY}
            onExit={this.handleOnExit}
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
