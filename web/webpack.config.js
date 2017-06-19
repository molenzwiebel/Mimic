/**
 * Created by thijsmolendijk on 06-03-17.
 */
const path = require("path");
const webpack = require("webpack");
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");

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
                loader: "vue-loader",
                options: {
                    postcss: [require("autoprefixer")]
                }
            }, {
                test: /\.json$/,
                loader: "file-loader"
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
            extensions: [".js", ".json", ".ts", ".html", ".vue"]
        },
        devServer: {
            hot: true,
            contentBase: path.resolve(__dirname, "src"),
            publicPath: "/",
            port: 8081
        },
        plugins: [
            new SWPrecacheWebpackPlugin({
                filename: "service-worker.js",
                minify: true,
                navigateFallback: "/index.html"
            }),
            new webpack.HotModuleReplacementPlugin()
        ]
    };
};
