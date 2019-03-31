import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';
import fetch from 'isomorphic-unfetch';
import ConfigPropertyInputGroup from '../components/configPropertyInputGroup';
import Link from 'next/link';

const Accounts = props => {
  const configProperties = [
    { displayName: 'client_id', propertyId: 'PLAID_CLIENT_ID' },
    { displayName: 'public_key', propertyId: 'PLAID_PUBLIC_KEY' },
    { displayName: 'development_secret', propertyId: 'PLAID_SECRET' }
  ];

  return (
    <div className='wrapper'>
      <ProgressSidebar tab='accounts' config={props.config} />
      <div className='container container-vc'>
        <div className='inner-container'>
          <h2>Plaid Setup</h2>
          <ol type='1'>
            <li>
              Sign up for a <a href='https://plaid.com/'>Plaid</a> account.
            </li>
            <li>
              <a href='https://plaid.com/pricing/'>Apply</a> for the free, 100-account development plan (takes 1-2
              days).
            </li>
            <li>
              Once approved, visit the{' '}
              <a href='https://dashboard.plaid.com/overview/development'>Development Overview</a> and fill the following
              values:
              <ConfigPropertyInputGroup configProperties={configProperties} config={props.config} />
            </li>
            <Link href='/sheets'>
              <button>Next</button>
            </Link>
          </ol>
        </div>
      </div>
    </div>
  );
};

Accounts.getInitialProps = async function() {
  const res = await fetch('http://localhost:3000/config');

  return { config: await res.json() };
};

export default Accounts;
