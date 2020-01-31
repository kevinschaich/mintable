
          <ol type='1'>
            <li>
              <a target='_blank' href='https://dashboard.plaid.com/signup'>
                Sign up
              </a>{' '}
              for a Plaid account.
            </li>
            <li>
              <a target='_blank' href='https://plaid.com/pricing/'>
                Apply
              </a>{' '}
              for the free, 100-account development plan (takes 1-2 days).
            </li>
            <li>
              Once approved,{' '}
              <a target='_blank' href='https://dashboard.plaid.com/account/keys'>
                find your API keys
              </a>{' '}
              and copy them over.
              <ConfigPropertyInputGroup configProperties={configProperties} config={props.config} />
            </li>
            <Link href='/account-setup'>
              <button>Next</button>
            </Link>
          </ol>
