import '../styles/style.scss'
import { fetch } from '../components/helpers'
const _ = require('lodash')
import ConfigPropertyInputGroup from '../components/configPropertyInputGroup'
import Accounts from '../components/accounts'

const Settings = props => {
  const configProperties = _.map(_.keys(props.config), property => {
    return { displayName: property, propertyId: property }
  })

  return (
    <div className='wrapper'>
      <div className='container'>
        <h1>Accounts</h1>
        <Accounts config={props.config} />
        <h1>Settings</h1>
        <span>
          Any settings changed below will automatically update your config file. Some settings may require a server
          restart to take effect.
        </span>
        <ConfigPropertyInputGroup configProperties={configProperties} config={props.config} />
      </div>
    </div>
  )
}

Settings.getInitialProps = async function() {
  return { config: await fetch(`http://${process.env.HOST}:${process.env.PORT}/config`) }
}

export default Settings
