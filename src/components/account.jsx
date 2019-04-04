import { FiRefreshCw, FiTrash2, FiXCircle, FiCheckCircle } from 'react-icons/fi'

const Account = props => {
  let status = <FiCheckCircle className='icon' />
  if (props.details.error) {
    status = (
      <span>
        <FiXCircle className='icon' />
        Error
      </span>
    )
  }

  const handleOnClickUpdate = e => {
    const body = {
      accountNickname: props.details.nickname
    }

    fetch('http://localhost:3000/update', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(async resp => {
        const data = await resp.json()
        props.handleOnUpdateAccountResponse(data)
      })
      .catch(error => console.log(error))
  }

  return (
    <div className='account-details'>
      <div className='account-nickname'>{props.details.nickname}</div>
      <div className='status' title={props.details.error || ''}>
        {status}
      </div>
      <div className='button' title='Refresh Credentials' onClick={handleOnClickUpdate}>
        <FiRefreshCw className='icon' />
      </div>
      <div className='button' title='Remove Account'>
        <FiTrash2 className='icon' />
      </div>
    </div>
  )
}

export default Account
