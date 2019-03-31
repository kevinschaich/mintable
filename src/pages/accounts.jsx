import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';
import * as _ from 'lodash';
import fetch from 'isomorphic-unfetch';

const ConfigPropertyInput = props => (
  <div className='config-property-input'>
    <code>{props.displayName}</code>
    <input
      type='text'
      id={props.propertyId}
      name={props.propertyId}
      defaultValue={props.config[props.propertyId]}
      onChange={props.onChange}
    />
  </div>
);

const ConfigPropertyInputGroup = props => {
  const handleInputChange = e => {
    const newConfig = {
      ...props.config,
      [e.currentTarget.id]: e.currentTarget.value
    };

    console.log('OLD', props.config);
    console.log('NEW', newConfig);
    fetch('http://localhost:3000/config', {
      method: 'PUT',
      body: JSON.stringify(newConfig),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  const configPropertyInputs = _.map(props.configProperties, property => {
    return (
      <ConfigPropertyInput
        config={props.config}
        displayName={property.displayName}
        propertyId={property.propertyId}
        onChange={handleInputChange}
        key={property.propertyId}
      />
    );
  });

  return <div className='config-container'>{configPropertyInputs}</div>;
};

const Accounts = props => {
  const configProperties = [
    { displayName: 'client_id', propertyId: 'PLAID_CLIENT_ID' },
    { displayName: 'public_key', propertyId: 'PLAID_PUBLIC_KEY' },
    { displayName: 'development_secret', propertyId: 'PLAID_SECRET' }
  ];
  console.log(props.config);

  return (
    <div className='wrapper'>
      <ProgressSidebar tab='accounts' />
      <div className='container'>
        <div className='inner-container'>
          <h1>Plaid Setup</h1>
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
            <li>You're done!</li>
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
