import ProgressItem from './progressItem';

const ProgressSidebar = props => {
  return (
    <div className='progress-sidebar'>
      <ProgressItem tab={props.tab} number={1} title='Welcome' href='/' />
      <ProgressItem
        completed={props.config.accountsSetupCompleted}
        tab={props.tab}
        number={2}
        title='Accounts Setup'
        href='/accounts'
      />
      <ProgressItem
        completed={props.config.sheetsSetupCompleted}
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
