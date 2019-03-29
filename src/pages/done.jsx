import '../style.scss';
import ProgressHeader from '../components/progressHeader';

const Done = () => (
  <div className='wrapper'>
    <ProgressHeader />
    <div className='container'>
      <h1>Looks like we're all set here!</h1>
      <button>Get Started</button>
    </div>
  </div>
);

export default Done;
