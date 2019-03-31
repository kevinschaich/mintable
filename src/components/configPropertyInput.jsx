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

export default ConfigPropertyInput;