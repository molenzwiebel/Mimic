/**
 * Created by thijsmolendijk on 06-03-17.
 */
const path = require("path");
const webpack = require("webpack");

module.exports = function(env) {
    return {
        entry: [
            "webpack-dev-server/client?http://0.0.0.0:8081",
            "webpack/hot/only-dev-server",
            "./src/index.ts"
        ],
        output: {
            filename: "bundle.js",
            path: path.resolve(__dirname, "dist")
        },
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: { appendTsSuffixTo: [/\.vue$/] }
            }, {
                test: /\.vue$/,
                loader: "vue-loader"
            }, {
                test: /\.png$/,
                loader: "url-loader"
            }]
        },
        resolve: {
            extensions: [".js", ".ts", ".html", ".vue"]
        },
        devServer: {
            hot: true,
            contentBase: path.resolve(__dirname, "src"),
            publicPath: "/",
            port: 8081
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin()
        ]
    };
};