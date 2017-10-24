/**
 * Created by thijsmolendijk on 06-03-17.
 */
const path = require("path");
const webpack = require("webpack");
const SWPrecacheWebpackPlugin = require("sw-precache-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FriendlyErrors = require('friendly-errors-webpack-plugin');

module.exports = function(env) {
    return {
        entry: env === "prod" ? ["./src/index.ts"] : [
            "webpack-dev-server/client?http://0.0.0.0:8081",
            "webpack/hot/only-dev-server",
            "./src/index.ts"
        ],
        output: {
            filename: "[name].js",
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
            new webpack.HotModuleReplacementPlugin(),
            new HtmlWebpackPlugin({
				filename: "index.html",
				template: path.resolve(__dirname, "src/index.html"),
				inject: true,
				minify: {
					removeComments: env === "prod",
					collapseWhitespace: env === "prod",
					removeAttributeQuotes: env === "prod"
				},
            }),
			new FriendlyErrors(),
			new webpack.optimize.CommonsChunkPlugin({
				name: "common",
				minChunks: function (module, count) {
					// any required modules inside node_modules are extracted to vendor
					return (
						module.resource &&
						/\.js$/.test(module.resource) &&
						module.resource.indexOf(
							path.join(__dirname, "../node_modules")
						) === 0
					);
				}
			}),
			// extract webpack runtime and module manifest to its own file in order to
			// prevent commons hash from being updated whenever app bundle is updated
			new webpack.optimize.CommonsChunkPlugin({
				name: "common",
				chunks: ["common"]
			})
        ]
    };
};
