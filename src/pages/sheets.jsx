import '../style.scss';
import ProgressSidebar from '../components/progressSidebar';
import fetch from 'isomorphic-unfetch';

const Sheets = props => (
  <div className='wrapper'>
    <ProgressSidebar tab='sheets' config={props.config}/>
    <div className='container'>
      <h1>Sheets!</h1>
      <button>Get Started</button>
    </div>
  </div>
);

Sheets.getInitialProps = async function () {
  const res = await fetch('http://localhost:3000/config');

  return { config: await res.json() };
};

export default Sheets;
