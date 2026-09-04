const path = require('node:path')

module.exports = {
  mode: 'production',
  entry: {
    // Proves `.` + the explicit `./style.css` import resolve under Webpack.
    main: './src/main.js',
    // Proves `./full` — the side-effect-bundled entry — resolves too.
    full: './src/full.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      { test: /\.css$/, use: [require.resolve('style-loader'), require.resolve('css-loader')] },
    ],
  },
}
