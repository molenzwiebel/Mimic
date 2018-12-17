// Select either config.prod or config.dev based on runtime.
module.exports = (env, args) => {
    if (args.mode === "production") {
        return require("./webpack.config.prod");
    }

    return require("./webpack.config.dev");
};