import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';

const Done = () => (
  <div className='wrapper'>
    <ProgressSidebar tab='done' />
    <div className='container'>
      <h1>Looks like we're all set here!</h1>
      <button>Get Started</button>
    </div>
  </div>
);

export default Done;
