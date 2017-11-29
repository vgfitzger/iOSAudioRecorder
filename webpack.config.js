
require('es6-promise').polyfill()

var path = require('path');
var webpack = require('webpack');

var BASEPATH = __dirname + "/app";


module.exports = {
    context: BASEPATH,
    entry: {
    app: "./app.jsx",
},
    
output: {
    path: BASEPATH + "/static/compiled",
    filename: '_[name].js' // 'bundle.js',
},
    
module: {
    noParse: [/aws\-sdk/],
    loaders: [
              {
              test: /.jsx?$/,
              loader: 'babel-loader',
              exclude: /node_modules/,
              query: {
              presets: ['es2015', 'react']
              }
              },
              {
              test: /.scss?$/,
              loaders: [ 'style-loader', 'css-loader', 'sass-loader' ]
              },
              {
              test: /\.html$/,
              loader: "file?name=[name].[ext]",
              }
              ]
    },
};

