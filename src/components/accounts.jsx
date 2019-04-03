import '../styles/style.scss';
import PlaidLink from 'react-plaid-link';
import React from 'react';
import Account from './account';

class Accounts extends React.Component {
  constructor(props) {
    super(props);
    this.state = { newAccountNickname: '', accounts: [] };
  }

  componentDidMount = async () => {
    const accounts = await fetch('http://localhost:3000/balances');
    this.setState({ accounts: await accounts.json() });
  };

  handleOnNewAccountNameChange = e => {
    this.setState({ newAccountNickname: e.currentTarget.value });
  };

  handleOnSuccess = (token, metadata) => {
    console.log(token, metadata);
    const body = { token, accountNickname: this.state.newAccountNickname };

    fetch('http://localhost:3000/token', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(resp => {
        console.log(resp);
        if (resp.status === 201) {
          console.log('Saved access token.');
        }
      })
      .catch(e => console.log(e));
  };

  handleOnExit = () => {
    console.log('Authentication cancelled: Could not save access token.');
  };

  render = () => {
    const accounts = this.state.accounts.map(account => <Account details={account} />);

    return (
      <div className='accounts'>
        <h1>Accounts</h1>
        <div className='accounts-list'>{accounts.length ? accounts : <span>Loading...</span>}</div>
        <div className='new-account'>
          <input
            id='new-account-name'
            name='new-account-name'
            placeholder='New Account Nickname'
            onChange={this.handleOnNewAccountNameChange}
          />
          {this.state.newAccountNickname && (
            <PlaidLink
              clientName='Mintable'
              env='development'
              product={['auth', 'transactions']}
              publicKey={this.props.config.PLAID_PUBLIC_KEY}
              onExit={this.handleOnExit}
              onSuccess={this.handleOnSuccess}
              style={{ background: '#137cbd' }}
              disabled={true}
            >
              Add New Account
            </PlaidLink>
          )}
        </div>
      </div>
    );
  };
}

export default Accounts;
