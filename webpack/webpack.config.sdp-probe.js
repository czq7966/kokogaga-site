const path = require('path');
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = env => {
    env = env ? env : {}; //环境变量
    const mode = env.production ? "production" : "development"; //开发或生产模式
    const devtool = env.production || env.nodevtool ? "" : "source-map"; //
    const node_env = process.env.NODE_ENV || mode;
    const entry = {}; 
    const plugins = [];
    const optimization = {};  //优化选项
    const minimizer = []; //优化选项：瘦身器
    const externals = [nodeExternals({ modulesFromFile: true })];
    const libraryTarget = env.amd ? 'amd' : env.umd ? 'umd' :  env.cjs ? 'commonjs' : env.old ? 'umd' : 'commonjs';
    const distDir = path.resolve(__dirname, '../dist/web/sdp-probe');
    const srcDir =  path.resolve(__dirname, '../src/web/sdp-probe');
    entry['index'] = path.resolve(srcDir, "index.ts");
    
    optimization['minimizer'] = minimizer;  

    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: "'" + node_env  + "'",
                LIBRARY_TARGET: "'" + libraryTarget  + "'",                
            }
        }),         
        new CopyWebpackPlugin([
            {
                from: path.resolve(srcDir, 'index.html'),
                to: 'index.html',
            }                    
        ]),        
    )

    if (env.production) { //生产模式
        minimizer.push(
            new UglifyJsPlugin()
        )
    }

    const node = {
        __dirname: false,
        __filename: false,
        process: false
    }


    return {
        mode: mode,
        entry: entry,
        devtool: devtool,
        output: {
            path: distDir,
            libraryTarget: libraryTarget,
            filename: "[name].js"
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"]
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    loader: "style-loader!css-loader",
                    exclude: /node_modules/
                },
            ]
        },
        plugins: plugins,
        optimization: optimization,
        plugins: plugins,
        externals: [
            // nodeExternals({ modulesFromFile: true }),
            {
                'fs': 'fs',
                'path': 'path',
                'http': 'http',
                'https': 'https',
                'electron': 'electron'                
            }

        ],
        node: node
    }
}

