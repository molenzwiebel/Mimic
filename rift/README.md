# :sparkles: Mimic - Rift

The server-side tunneling components for Mimic that faciliates communication between the mobile clients and Conduit instances without those Conduit instances needing to be exposed to the internet. This is also the component responsible for assigning unique identifiers to Conduit instances for them to identify themselves. All traffic going through Rift is encrypted; Rift (and thus whoever is hosting Rift) cannot read your messages or other sensitive traffic.

Rift is built using [Node.js](https://nodejs.org) and [TypeScript](https://www.typescriptlang.org). The database is powered by SQLite.

## Development

You will need [Yarn](https://yarnpkg.com/lang/en/) for developing the Rift component, and at least Node 7+ for the async-await components.

After checking out the source, run `yarn install` to install all dependencies. You will only need to do this after pulling updates from Github.

During development, you can use `yarn watch` to automatically compile TypeScript files once they are edited. However, it is recommended to simply use `yarn start` to start the application, since this will also compile all TypeScript files into Javascript files.

`yarn bundle` acts the same as `yarn watch`, except it will only compile the files once and not listen for edits.

## License

The Rift component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.