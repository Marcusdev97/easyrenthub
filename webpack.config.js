const path = require('path');

module.exports = {
  entry: './backend/scripts.js',  // Ensure this points to the main JS file in the backend directory
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve static files from the dist directory
    },
  },
};