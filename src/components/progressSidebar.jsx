import ProgressItem from './progressItem';

const ProgressSidebar = props => {
  const accountsSetupCompleted =
    props.config &&
    props.config.PLAID_CLIENT_ID &&
    props.config.PLAID_CLIENT_ID.length > 0 &&
    props.config.PLAID_PUBLIC_KEY &&
    props.config.PLAID_PUBLIC_KEY.length > 0 &&
    props.config.PLAID_SECRET &&
    props.config.PLAID_SECRET.length > 0;

  const sheetsSetupCompleted =
    props.config &&
    props.config.SHEETS_SHEET_ID &&
    props.config.SHEETS_SHEET_ID.length > 0 &&
    props.config.SHEETS_CLIENT_ID &&
    props.config.SHEETS_CLIENT_ID.length > 0 &&
    props.config.SHEETS_CLIENT_SECRET &&
    props.config.SHEETS_CLIENT_SECRET.length > 0 &&
    props.config.SHEETS_REDIRECT_URI &&
    props.config.SHEETS_REDIRECT_URI.length > 0;

  return (
    <div className='progress-sidebar'>
      <ProgressItem tab={props.tab} number={1} title='Welcome' href='/' />
      <ProgressItem
        completed={accountsSetupCompleted}
        tab={props.tab}
        number={2}
        title='Accounts Setup'
        href='/accounts'
      />
      <ProgressItem
        completed={sheetsSetupCompleted}
        tab={props.tab}
        number={3}
        title='Spreadsheet Setup'
        href='/sheets'
      />
      <ProgressItem tab={props.tab} number={4} title='Done!' href='/done' />
    </div>
  );
};

export default ProgressSidebar;
