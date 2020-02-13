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
    const distDir = path.resolve(__dirname, '../dist/desktop/sender/web');
    const srcDir =  path.resolve(__dirname, '../src/desktop/sender/web');
    const resDir =  path.resolve(__dirname, '../../activ-cast/src/activ-cast');
    entry['pages/dropdown/index'] = path.resolve(srcDir, "pages/dropdown/index.tsx");
    
    optimization['minimizer'] = minimizer;  

    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: "'" + node_env  + "'",
            }
        }),         
        new CopyWebpackPlugin([
            {
                from: path.resolve(srcDir, 'index.html'),
                to: 'index.html',
            },              
            {
                from: path.resolve(srcDir, 'pages/dropdown/index.html'),
                to: 'pages/dropdown/index.html',
            },  
            {
                from: path.resolve(resDir, 'images'),
                to: 'images',
            },                
            {
                from: path.resolve(resDir, '_locales'),
                to: '_locales',
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
                'zlib': 'zlib',
                'electron': 'electron'                
            }

        ],
        node: node
    }
}

