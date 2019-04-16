import ProgressItem from './progressItem'
import * as _ from 'lodash'

const ProgressSidebar = props => {
  return (
    <div className='progress-sidebar'>
      <ProgressItem tab={props.tab} number={1} title='Welcome' href='/welcome' />
      <ProgressItem
        completed={props.config.accountProviderSetupComplete}
        tab={props.tab}
        number={2}
        title={`${_.startCase(_.lowerCase(props.config.ACCOUNT_PROVIDER))} Setup`}
        href='/account-provider-setup'
      />
      <ProgressItem
        completed={props.config.accountSetupComplete}
        tab={props.tab}
        number={3}
        title='Account Setup'
        href='/account-setup'
      />
      <ProgressItem
        completed={props.config.sheetProviderSetupComplete}
        tab={props.tab}
        number={4}
        title={`${_.startCase(_.lowerCase(props.config.SHEET_PROVIDER))} Setup`}
        href='/sheet-provider-setup'
      />
      <ProgressItem tab={props.tab} number={5} title='Done!' href='/done' />
    </div>
  )
}

export default ProgressSidebar
