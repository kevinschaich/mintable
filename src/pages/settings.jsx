import '../style.scss';
import fetch from 'isomorphic-unfetch';
const _ = require('lodash');
import ConfigPropertyInputGroup from '../components/configPropertyInputGroup';

const Settings = props => {
  const configProperties = _.map(_.keys(props.config), property => {
    return { displayName: property, propertyId: property };
  });

  return (
    <div className='wrapper'>
      <div className='container'>
        <h1>Accounts</h1>
        <h1>Update Transactions</h1>
        <button>Run Mintable</button>
        <h1>Settings</h1>
        <span>Any settings changed below will automatically update.</span>
        <ConfigPropertyInputGroup configProperties={configProperties} config={props.config} />
      </div>
    </div>
  );
};

Settings.getInitialProps = async function() {
  const res = await fetch('http://localhost:3000/config');

  return { config: await res.json() };
};

export default Settings;