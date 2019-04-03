import { FiEdit, FiTrash2, FiInfo, FiCheckCircle } from 'react-icons/fi';

const Account = props => {
  let status = <FiCheckCircle className='icon' />;

  if (props.details.error) {
    status = (
      <span>
        <FiInfo className='icon' />
        Error
      </span>
    );
  }

  return (
    <div className='account-details'>
      <div className='account-nickname'>{props.details.nickname}</div>
      <div className='status' title={props.details.error || ''}>
        {status}
      </div>
      <div className='button' title='Update Credentials'>
        <FiEdit className='icon' />
      </div>
      <div className='button' title='Remove Account'>
        <FiTrash2 className='icon' />
      </div>
    </div>
  );
};

export default Account;
