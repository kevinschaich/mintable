import '../style.scss';
import Link from 'next/link';
import ProgressSidebar from '../components/progressSidebar';

const Welcome = () => (
  <div className='wrapper'>
    <ProgressSidebar tab='' />
    <div className='container'>
      <img style={{width: "120px"}} src="/static/icon.png"/>
      <h1>Welcome to Mintable</h1>
      <Link href="/accounts"><button>Get Started</button></Link>
    </div>
  </div>
);

export default Welcome;
