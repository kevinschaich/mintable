import Check from './check';

const Account = props => {
  return (
    <div className='account-details'>
      <div>{props.details.nickname}</div>
      <div title={props.details.error ? props.details.error : ''}>{props.details.error ? 'Error' : <Check />}</div>
    </div>
  );
};

export default Account;
