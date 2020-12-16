const fs = require('fs')
const path = require('path');
//引用webpack
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HTMLPlugin = require('html-webpack-plugin');
const isDev = process.env.NODE_ENV === 'development';
const config = {
    entry: path.join(__dirname, './src/main.js'), // 入口文件 用path.join(__dirname, 'src/main.js')将路径拼接为绝对路径
    // entry: './src/main.js', // 入口文件 用path.join(__dirname, 'src/main.js')将路径拼接为绝对路径
    output: {
        filename: '[name].bundle.js', // 文件输出
        path: path.resolve(__dirname, './dist')
    },
    plugins: [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: isDev ? '"development"' : '"production"'
            }
        }),
        new HTMLPlugin() // 处理html模版
    ],
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader' // 处理以.vue结尾的文件
            },
            {
                test: /\.css$/, // 处理css文件
                use: ['style-loader',
                    'css-loader'],
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            },
            {
                test: /\.(gif|jpg|jpeg|png|svg)$/, // 处理图片文件
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 1024,
                            name: '[name].[ext]',
                            esModule: false
                        }
                    }
                ]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
                loader: 'file-loader',
                options: {
                    esModule: false
                }
            }
        ]
    },
    devtool: '#cheap-module-eval-source-map', // 调试代码时可以看到自己原本的代码，而不是编译后的
    devServer: {
        //加载内容目录
        contentBase: './dist',
        //是否热加载
        hot: true,
        //加载IP地址
        host: '192.168.31.131',
        port: 8056,
        https: {
            key: fs.readFileSync('./configs/newCerts/server.key'),
            cert: fs.readFileSync('./configs/newCerts/server.crt'),
        },
        historyApiFallback: true,
        publicPath: './',
        disableHostCheck: true,
        //热加载
        overlay: {
            errors: true // 将webpack编译的错误显示在网页上面
        },
        open: true // 在启用webpack-dev-server时，自动打开浏览器
    },
    target: 'web',
}
if (isDev) {
    // 加插件，push一个新的webpack plugin
    //下面是不刷新更新内容
    config.plugins.push(
        // 启动热更新功能插件
        new webpack.HotModuleReplacementPlugin(),
        // 帮助减少不需要的信息展示
        new webpack.NoEmitOnErrorsPlugin()
    )
}
module.exports = config;
