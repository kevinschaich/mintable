import '../styles/style.scss'
import Link from 'next/link'
import ProgressSidebar from '../components/progressSidebar'
import { fetch } from '../components/helpers'

const Done = props => (
  <div className='wrapper'>
    <ProgressSidebar tab='done' config={props.config} />
    <div className='container container-vc'>
      <h1>Looks like we're all set here!</h1>
      <Link href='/settings'>
        <button>Go to Settings</button>
      </Link>
    </div>
  </div>
)

Done.getInitialProps = async function() {
  return { config: await fetch(`http://${process.env.HOST}:${process.env.PORT}/config`) }
}

export default Done
