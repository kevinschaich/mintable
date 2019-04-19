import '../styles/style.scss'
import ProgressSidebar from '../components/progressSidebar'
import { fetch } from '../components/helpers'
import Link from 'next/link'
import Accounts from '../components/accounts'

const AccountSetup = props => {
  return (
    <div className='wrapper'>
      <ProgressSidebar tab='account-setup' config={props.config} />
      <div className='container container-vc'>
        <div className='inner-container'>
          <h2>Account Setup</h2>
          <Accounts config={props.config} />
          <Link href='/sheet-provider-setup'>
            <button>Next</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

AccountSetup.getInitialProps = async function() {
  return { config: await fetch(`http://${process.env.HOST}:${process.env.PORT}/config`) }
}

export default AccountSetup
