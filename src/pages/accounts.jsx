import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';

const Index = () => (
  <div className='wrapper'>
    <ProgressSidebar />
    <div className='container'>
      <h1>Accounts!</h1>
      <button>Get Started</button>
    </div>
  </div>
);

export default Index;
