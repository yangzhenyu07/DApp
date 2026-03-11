// webpack.common.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const NODE_ENV = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(__dirname, `.env.${NODE_ENV}`) });
console.log('=== 环境变量调试 ===', {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.DEBUG,
  isDebug: process.env.DEBUG === 'true' && process.env.NODE_ENV === 'dev'
});
module.exports = {
  // Webpack必配mode，映射为合法值，解决之前的Schema报错
  mode: NODE_ENV === 'dev' ? 'development' : 'production',
  // 原有配置：entry 绝对路径，保留
  entry: path.resolve(__dirname, 'src', 'main.ts'),
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        // 指定前端专用tsconfig-frontend.json
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig-frontend.json')
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      inject: 'body',
      minify: NODE_ENV === 'prod' ? {
        removeComments: true,
        collapseWhitespace: true
      } : false
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
        TARGET_CHAIN_ID: process.env.TARGET_CHAIN_ID,
        DEBUG: process.env.DEBUG
      })
    })
  ]
};