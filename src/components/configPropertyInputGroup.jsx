import '../style.scss';
import * as _ from 'lodash';
import fetch from 'isomorphic-unfetch';
import ConfigPropertyInput from "./configPropertyInput";

const ConfigPropertyInputGroup = props => {
  const handleInputChange = e => {
    const newConfig = {
      ...props.config,
      [e.currentTarget.id]: e.currentTarget.value
    };

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

export default ConfigPropertyInputGroup;
