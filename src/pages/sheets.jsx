import '../styles/style.scss';
import ProgressSidebar from '../components/progressSidebar';
import fetch from 'isomorphic-unfetch';
import ConfigPropertyInputGroup from '../components/configPropertyInputGroup';
import Link from 'next/link';

const Sheets = props => {
  const sheetConfigProperties = [{ displayName: 'sheet_id', propertyId: 'SHEETS_SHEET_ID' }];
  const configFileProperties = [
    { displayName: 'client_id', propertyId: 'SHEETS_CLIENT_ID' },
    { displayName: 'client_secret', propertyId: 'SHEETS_CLIENT_SECRET' },
    { displayName: 'redirect_uri', propertyId: 'SHEETS_REDIRECT_URI' }
  ];

  return (
    <div className='wrapper'>
      <ProgressSidebar tab='sheets' config={props.config} />
      <div className='container container-vc'>
        <div className='inner-container'>
          <h2>Google Sheets Setup</h2>
          <ol type='1'>
            <li>
              <a href='https://docs.google.com/spreadsheets/create'>Create a new Google Sheets spreadsheet</a>.
            </li>
            <li>
              Note the <code>sheet_id</code> part of the page URL:
              <br />
              <code>
                docs.google.com/spreadsheets/d/<strong className='blue'>{'sheet_id'}</strong>/edit
              </code>
              <ConfigPropertyInputGroup configProperties={sheetConfigProperties} config={props.config} />
            </li>
            <li>
              Go to the{' '}
              <a href='https://developers.google.com/sheets/api/quickstart/nodejs'>Google Sheets API Quickstart</a> and
              click <strong>Enable the Google Sheets API</strong>.
            </li>
            <li>
              Follow instructions and click <strong>Download Client Configuration</strong>.
            </li>
            <li>
              Fill in the following values (use the last value in redirect_uris):
              <ConfigPropertyInputGroup configProperties={configFileProperties} config={props.config} />
            </li>
            <Link href='/done'>
              <button>Next</button>
            </Link>
          </ol>
        </div>
      </div>
    </div>
  );
};

Sheets.getInitialProps = async function() {
  const res = await fetch('http://localhost:3000/config');

  return { config: await res.json() };
};

export default Sheets;
