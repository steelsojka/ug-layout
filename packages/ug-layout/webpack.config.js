var path = require('path');

module.exports = {
  entry: {
    bundle: path.join(__dirname, 'test/live/index.ts'),
    detached: path.join(__dirname, 'test/live/detached.ts')
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'test/live/bundle')
  },
  resolve: {
    extensions: ['.ts', '.js', '.css']
  },
  module: {
    rules: [{
      exclude: /node_modules/,
      test: /\.ts$/,
      use: ['babel-loader', 'ts-loader']
    }, {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.(svg|woff|ttf|eot)$/,
      use: ['file-loader']
    }]
  },
  devtool: 'inline-source-map',
  devServer: {
    host: '0.0.0.0',
    contentBase: path.join(__dirname, 'test/live'),
    watchContentBase: true,
    watchOptions: {
      poll: 2000
    }
  }
};