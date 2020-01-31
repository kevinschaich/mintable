
    server.post('/token', (req, res) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return require('../lib/plaid')
            .saveAccessToken(req.body.public_token, req.body.accountNickname)
            .then(res.redirect(`http://${process.env.HOST}:${process.env.PORT}/settings`))
            .catch(error => res.json(error))
        default:
          return res.json({ data: {} })
      }
    })

    server.post('/update', (req, res) => {
      switch (process.env.ACCOUNT_PROVIDER) {
        case 'plaid':
          return require('../lib/plaid')
            .createPublicToken(process.env[`PLAID_TOKEN_${req.body.accountNickname}`], req.body.accountNickname)
            .then(token => res.json({ data: token }))
            .catch(error => res.json(error))
        default:
          return res.json({ data: {} })
      }
    })

    server.get('/google-sheets-url', (req, res) => {
      return require('../lib/google')
        .getAuthURL()
        .then(url => res.json({ data: url }))
        .catch(error => res.json(error))
    })

    server.get('/google-sheets-oauth2callback', (req, res) => {
      return require('../lib/google')
        .getToken(req.query.code)
        .then(token => res.redirect(`http://${process.env.HOST}:${process.env.PORT}/sheet-provider-setup`))
        .catch(error => res.json(error))
    })
