const withSass = require("@zeit/next-sass");
const webpack = require('webpack')
module.exports = withSass({
  webpack: cfg => {
    cfg.plugins.push(
      new webpack.DefinePlugin({
        'process.env.HOST': JSON.stringify(process.env.HOST),
        'process.env.PORT': JSON.stringify(process.env.PORT)
      })
    )

    return cfg
  }
});
