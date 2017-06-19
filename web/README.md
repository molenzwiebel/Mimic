# :iphone: Mimic - Web

The web component for Mimic. Uses [Vue](https://vuejs.org), [TypeScript](https://www.typescriptlang.org) and [Stylus](http://stylus-lang.com). This is the actual component that powers the web application. It is served using a simple Nginx static host, with CloudFlare for caching.

## Development

You will need [Yarn](https://yarnpkg.com/lang/en/) for developing the web component.

After checking out the source, run `yarn install` to install all dependencies. You will only need to do this after pulling updates from Github.

During development, you can use `yarn watch` to start a webserver at [localhost:8081](http://localhost:8081). This webserver uses Hot Module Reloading to automatically refresh the UI whenever a file is edited.

Building a release bundle can be done using `yarn bundle`. This will generate a folder called `dist/` that contains all files, _except index.html, manifest.json and the icons directory_. You will need to copy the index.html from `src/`.

## License

The web component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.
