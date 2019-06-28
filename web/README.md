# :iphone: Mimic - Web

The web component for Mimic. Uses [Vue](https://vuejs.org), [TypeScript](https://www.typescriptlang.org) and [Stylus](http://stylus-lang.com). This is the actual component that powers the web application. It is served using a simple Nginx static host, with CloudFlare for caching.

## Development

You will need [Yarn](https://yarnpkg.com/lang/en/) for developing the web component.

After checking out the source, run `yarn install` to install all dependencies. You will only need to do this after pulling updates from Github.

During development, you can use `yarn serve` to start a webserver at [localhost:8080](http://localhost:8080). This webserver uses Hot Module Reloading to automatically refresh the UI whenever a file is edited.

Building a release bundle can be done using `yarn build`. This will generate a folder called `dist/` that contains all files needed to deploy.

Building is managed through vue-cli. It takes care of automatically optimizing, minifying, transpiling and everything else.

## License

-The web component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.