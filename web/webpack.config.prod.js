const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");

console.log("[+] Using production webpack config!");

module.exports = {
    entry: {
        app: "./src/index.ts"
    },
    output: {
        path: path.resolve(__dirname, `./dist/`),
        filename: "bundle.js"
    },
    devtool: false,
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
            loader: ["style-loader", "css-loader", "postcss-loader", "stylus-loader"]
        }, {
            test: /\.(png|svg|jpg|mp3)$/,
            loader: "url-loader",
            options: {
                limit: 8192
            }
        }, {
            test: /\.css$/,
            loader: ["style-loader", "css-loader", "postcss-loader"]
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
            hash: true,
            minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeAttributeQuotes: true
            }
        }),
        new VueLoaderPlugin(),
        new SWPrecacheWebpackPlugin({
            minify: true,
            navigateFallback: "/index.html"
        })
    ]
};
