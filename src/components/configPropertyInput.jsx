import { FiCheckCircle } from 'react-icons/fi';

const ConfigPropertyInput = props => (
  <div className='config-property-input'>
    <code>
      <FiCheckCircle className='icon' style={{color: `#FFFFFF${props.modified ? 'FF' : '00'}`}}/>
      {props.displayName}
    </code>
    <input
      type='text'
      id={props.propertyId}
      name={props.propertyId}
      defaultValue={props.config[props.propertyId]}
      onChange={props.onChange}
    />
  </div>
);

export default ConfigPropertyInput;
