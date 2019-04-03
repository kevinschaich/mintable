import Check from './check';

const ConfigPropertyInput = props => (
  <div className='config-property-input'>
    <code>
      <Check opacity={props.modified ? 1 : 0}/>
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