var path = require('path');

module.exports = {
  entry: path.join(__dirname, 'test/live/index.ts'),
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'test/live/bundle')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [{
      exclude: /node_modules/,
      test: /\.ts$/,
      use: ['babel-loader', 'ts-loader']
    }]
  },
  devServer: {
    contentBase: path.join(__dirname, 'test/live')
  }
};