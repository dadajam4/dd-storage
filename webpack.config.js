const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const playGroundBase = path.join(__dirname, 'docs/playground');

module.exports = {
  mode: process.env.NODE_ENV || 'development', // development | production

  entry: {
    main: path.join(__dirname, 'dev/main.ts'),
  },

  output: {
    path: playGroundBase,
    filename: '[name].js',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'dev/index.html'),
    }),
  ],

  resolve: {
    extensions: [
      '.wasm',
      '.mjs',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.vue',
      '.json',
    ],
    modules: ['node_modules', path.join(__dirname, 'src')],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          // {
          //   loader: 'babel-loader',
          //   options: babelOptions,
          //   // options: {
          //   //   plugins: babelOptions.plugins,
          //   // },
          // },
          {
            loader: 'ts-loader',
            // options: {
            //   appendTsSuffixTo: [/\.vue$/],
            // },
          },
        ],
      },
    ],
  },

  devServer: {
    contentBase: playGroundBase,
    compress: true,
    host: '0.0.0.0',
    disableHostCheck: true,
    port: 3000,
  },
};
