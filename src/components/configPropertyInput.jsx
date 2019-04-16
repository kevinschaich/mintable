import { FiCheckCircle, FiHelpCircle } from 'react-icons/fi'

const ConfigPropertyInput = props => (
  <div className='config-property-input'>
    <code title={props.tooltip}>
      <FiCheckCircle className='icon' style={{ color: `#FFFFFF${props.modified ? 'FF' : '00'}` }} />
      {props.displayName}
      {props.tooltip && <FiHelpCircle className='icon' style={{ paddingBottom: '4px' }} />}
    </code>
    <input
      type='text'
      id={props.propertyId}
      name={props.propertyId}
      defaultValue={props.config[props.propertyId]}
      onChange={props.onChange}
    />
  </div>
)

export default ConfigPropertyInput
