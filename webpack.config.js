/* global module, require, __dirname */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        checkers2d: './src/Controller/checkers2d.js',
        checkers3d: './src/Controller/checkers3d.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/View/checkers2d.html',
            filename: 'checkers2d.html',
        }),
        new HtmlWebpackPlugin({
            template: './src/View/checkers3d.html',
            filename: 'checkers3d.html',
        }),
    ],
    devServer: {
        port: 8087,
        hot: true,
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    target: ['web', 'es2020'],
};
