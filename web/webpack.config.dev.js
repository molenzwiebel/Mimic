const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");

console.log("[+] Using development webpack config!");

module.exports = {
    entry: {
        app: "./src/index.ts"
    },
    output: {
        path: path.resolve(__dirname, `./dist/`),
        filename: "bundle.js"
    },
    devtool: "cheap-eval-source-map",
    module: {
        rules: [{
            test: /\.vue$/,
            loader: "vue-loader"
        }, {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            options: {
                appendTsSuffixTo: [/\.vue$/]
            }
        }, {
            test: /\.styl(us)?$/,
            loader: ["vue-style-loader", "css-loader", "stylus-loader"]
        }, {
            test: /\.(png|svg|jpg|mp3)$/,
            loader: "url-loader",
            options: {
                limit: 8192
            }
        }, {
            test: /\.css$/,
            loader: ["vue-style-loader", "css-loader"]
        }]
    },
    resolve: {
        extensions: [".ts", ".js", ".vue", ".json"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(__dirname, "src/index.html"),
            inject: true,
            hash: true
        }),
        new VueLoaderPlugin()
    ]
};
