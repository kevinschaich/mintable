import '../style.scss';
import Link from 'next/link';
import ProgressHeader from '../components/progressHeader';

const Index = () => (
  <div className='wrapper'>
    <ProgressHeader />
    <div className='container'>
      <h1>Welcome to Mintable!</h1>
      <Link href="/accounts"><button>Get Started</button></Link>
    </div>
  </div>
);

export default Index;
