import '../styles/style.scss'
import ProgressSidebar from '../components/progressSidebar'
import { fetch } from '../components/helpers'
import ConfigPropertyInputGroup from '../components/configPropertyInputGroup'
import Link from 'next/link'

const AccountProviderSetup = props => {
  const configProperties = [
    {
      displayName: 'environment',
      propertyId: 'PLAID_ENVIRONMENT',
      tooltip:
        'Sandbox allows unlimited testing with sample accounts, development is limited to 100 free linked accounts.'
    },
    { displayName: 'client_id', propertyId: 'PLAID_CLIENT_ID' },
    { displayName: 'public_key', propertyId: 'PLAID_PUBLIC_KEY' },
    {
      displayName: `${props.config.PLAID_ENVIRONMENT ? props.config.PLAID_ENVIRONMENT + '_' : ''}secret`,
      propertyId: 'PLAID_SECRET',
      tooltip: 'Use the same secret as the environment above, i.e. either your Development Secret or Sandbox Secret.'
    }
  ]

  return (
    <div className='wrapper'>
      <ProgressSidebar tab='account-provider-setup' config={props.config} />
      <div className='container container-vc'>
        <div className='inner-container'>
          <h2>Plaid Setup</h2>
          <ol type='1'>
            <li>
              <a target='_blank' href='https://dashboard.plaid.com/signup'>
                Sign up
              </a>{' '}
              for a Plaid account.
            </li>
            <li>
              <a target='_blank' href='https://plaid.com/pricing/'>
                Apply
              </a>{' '}
              for the free, 100-account development plan (takes 1-2 days).
            </li>
            <li>
              Once approved,{' '}
              <a target='_blank' href='https://dashboard.plaid.com/account/keys'>
                find your API keys
              </a>{' '}
              and copy them over.
              <ConfigPropertyInputGroup configProperties={configProperties} config={props.config} />
            </li>
            <Link href='/account-setup'>
              <button>Next</button>
            </Link>
          </ol>
        </div>
      </div>
    </div>
  )
}

AccountProviderSetup.getInitialProps = async function() {
  return { config: await fetch(`http://${process.env.HOST}:${process.env.PORT}/config`) }
}

export default AccountProviderSetup
