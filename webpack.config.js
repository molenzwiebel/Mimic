/**
 * Created by thijsmolendijk on 06-03-17.
 */
const path = require("path");
const webpack = require("webpack");

module.exports = function(env) {
    return {
        entry: env === "prod" ? ["./src/index.ts"] : [
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
                loader: "file-loader"
            }, {
                test: /\.jpg$/,
                loader: "file-loader"
            }, {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }, {
                test: /\.mp3$/,
                loader: "file-loader"
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
            new webpack.HotModuleReplacementPlugin()
        ]
    };
};