import '../styles/style.scss';
import * as _ from 'lodash';
import fetch from 'isomorphic-unfetch';
import ConfigPropertyInput from './configPropertyInput';
import React from 'react';

class ConfigPropertyInputGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { modifiedProperties: new Set() };
  }

  handleInputChange = e => {
    const { id, value } = e.currentTarget;
    const body = { id, value };

    fetch('http://localhost:3000/config', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(resp => {
      console.log(resp);
      if (resp.status === 201) {
        this.setState({
          modifiedProperties: this.state.modifiedProperties.add(id)
        });
      }
    });
  };

  render() {
    const configPropertyInputs = _.map(this.props.configProperties, property => {
      return (
        <ConfigPropertyInput
          config={this.props.config}
          displayName={property.displayName}
          propertyId={property.propertyId}
          onChange={this.handleInputChange}
          key={property.propertyId}
          modified={this.state.modifiedProperties.has(property.propertyId)}
        />
      );
    });

    return <div className='config-container'>{configPropertyInputs}</div>;
  }
}

export default ConfigPropertyInputGroup;
