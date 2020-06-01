const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
    env = env ? env : {}; //环境变量
    const mode = env.production ? "production" : "development"; //开发或生产模式
    const devtool = env.production || env.nodevtool ? "" : "source-map"; //
    const entry = {}; 
    const plugins = [];
    const optimization = {};  //优化选项
    const minimizer = []; //优化选项：瘦身器
    const externals = {};
    const libraryTarget = env.amd ? 'amd' : env.umd ? 'umd' :  env.cjs ? 'commonjs' : env.old ? 'umd' : 'commonjs';
    // const libraryTargetPath =  env.amd ? 'amd' : env.umd ? 'umd' : env.cjs ? 'cjs' : env.old ? '' : 'cjs';
    // const distDir = path.resolve(__dirname, 'dist', libraryTargetPath);
    const distDir = path.resolve(__dirname, '../dist/web/kokogaga');
    const srcDir =  path.resolve(__dirname, '../src/web/kokogaga');
    entry['index'] = path.resolve(srcDir, "index.tsx");
    optimization['minimizer'] = minimizer;  

    plugins.push(
        new CopyWebpackPlugin([
            {
                from: path.resolve(srcDir, 'index.html'),
                to: 'index.html',
            }                   
        ]),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(srcDir, 'index.html'),
            inject: false,

            templateParameters: (compilation, assets, assetTags, options) => {
                return {
                    compilation,
                    webpackConfig: compilation.options,
                    htmlWebpackPlugin: {
                        tags: assetTags,
                        files: assets,
                        options
                    },
                    'scriptFile': path.basename(assets.js[0])
                };
            },

        }) 
    )

    if (env.production) { //生产模式
        minimizer.push(
            new UglifyJsPlugin()
        )
    }


    return {
        mode: mode,
        entry: entry,
        devtool: devtool,
        output: {
            path: distDir,
            libraryTarget: libraryTarget,
            filename: "[name].[hash].js"
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
                    use: [ 
                        {
                            loader: "style-loader"
                        }, 
                        {
                            loader: "css-loader",
                            options: {url: false}
                        }
                    ]
                },
                {
                    test: /\.less$/,
                    use: [{
                        loader: "style-loader" // creates style nodes from JS strings
                    }, {
                        loader: "css-loader", // translates CSS into CommonJS
                        options: {url: false}
                    }, {
                        loader: "less-loader" // compiles Less to CSS
                    }]
                }              
            ]
        },
        plugins: plugins,
        optimization: optimization,
        plugins: plugins,
        externals: externals
    }
}

