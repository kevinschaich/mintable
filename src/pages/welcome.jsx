import '../styles/style.scss'
import Link from 'next/link'
import ProgressSidebar from '../components/progressSidebar'
import { fetch } from '../components/helpers'

const Welcome = props => {
  return (
    <div className='wrapper'>
      <ProgressSidebar tab='' config={props.config} />
      <div className='container container-vc'>
        <img style={{ width: '120px' }} src='/static/icon.png' />
        <h1>Welcome to Mintable</h1>
        <Link href='/accounts'>
          <button>Get Started</button>
        </Link>
      </div>
    </div>
  )
}

Welcome.getInitialProps = async () => {
  return { config: await fetch('http://localhost:3000/config') }
}

export default Welcome
