import '../styles/style.scss'
import Link from 'next/link'
import ProgressSidebar from '../components/progressSidebar'
import fetch from 'isomorphic-unfetch'

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
  const res = await fetch('http://localhost:3000/config')

  return { config: await res.json() }
}

export default Welcome
