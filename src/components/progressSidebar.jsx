import ProgressItem from './progressItem';

const ProgressSidebar = props => {
  const accountsSetupCompleted = props && props.config && props.config.PLAID_CLIENT_ID && props.config.PLAID_PUBLIC_KEY && props.config.PLAID_SECRET;
  return (
  <div className='progress-sidebar'>
    <ProgressItem tab={props.tab} number={1} title='Welcome' href='/' />
    <ProgressItem completed={accountsSetupCompleted} tab={props.tab} number={2} title='Accounts Setup' href='/accounts' />
    <ProgressItem tab={props.tab} number={3} title='Spreadsheet Setup' href='/sheets' />
    <ProgressItem tab={props.tab} number={4} title='Done!' href='/done' />
  </div>
  )
};

export default ProgressSidebar;
