import '../styles/style.scss'
import * as _ from 'lodash'
import { fetch } from './helpers'
import ConfigPropertyInput from './configPropertyInput'
import React from 'react'

class ConfigPropertyInputGroup extends React.Component {
  constructor(props) {
    super(props)
    this.state = { modifiedProperties: new Set() }
  }

  handleInputChange = e => {
    const { id, value } = e.currentTarget
    const body = { updates: { [id]: value } }

    this.setState(
      {
        modifiedProperties: this.state.modifiedProperties.add(id)
      },
      () =>
        fetch(`http://${process.env.HOST}:${process.env.PORT}/config`, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json'
          }
        })
    )
  }

  render() {
    const configPropertyInputs = _.map(this.props.configProperties, property => {
      return (
        <ConfigPropertyInput
          config={this.props.config}
          displayName={property.displayName}
          propertyId={property.propertyId}
          tooltip={property.tooltip}
          onChange={this.handleInputChange}
          key={property.propertyId}
          modified={this.state.modifiedProperties.has(property.propertyId)}
        />
      )
    })

    return <div className='config-container'>{configPropertyInputs}</div>
  }
}

export default ConfigPropertyInputGroup
