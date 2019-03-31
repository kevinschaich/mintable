import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';
import fetch from 'isomorphic-unfetch';

const Done = props => (
  <div className='wrapper'>
    <ProgressSidebar tab='done' config={props.config} />
    <div className='container'>
      <h1>Looks like we're all set here!</h1>
      <button>Get Started</button>
    </div>
  </div>
);

Done.getInitialProps = async function () {
  const res = await fetch('http://localhost:3000/config');

  return { config: await res.json() };
};

export default Done;
