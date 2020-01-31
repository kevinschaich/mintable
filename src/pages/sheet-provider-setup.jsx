
          <h2>Google Sheets Setup</h2>
          <ol type='1'>
            <li>
              <a target='_blank' href='https://docs.google.com/spreadsheets/create'>
                Create a new Google Sheets spreadsheet
              </a>{' '}
              and copy over the <code>sheet_id</code> from the URL:
              <br />
              <code>
                docs.google.com/spreadsheets/d/
                <strong className='blue'>{'sheet_id'}</strong>/edit
              </code>
              <ConfigPropertyInputGroup configProperties={sheetConfigProperties} config={props.config} />
            </li>
            <li>
              Go to the{' '}
              <a target='_blank' href='https://developers.google.com/sheets/api/quickstart/nodejs'>
                Google Sheets API Quickstart
              </a>{' '}
              and click <strong>Enable the Google Sheets API</strong>.
            </li>
            <li>
              Follow instructions and copy over the resulting values:
              <ConfigPropertyInputGroup configProperties={configFileProperties} config={props.config} />
            </li>
            <li>
              Click this button to authorize Mintable to use Google Sheets:
              <br />
              <button onClick={handleOnClickAuth}>Authorize Google Sheets</button>
            </li>
            <Link href='/done'>
              <button>Next</button>
            </Link>
          </ol>