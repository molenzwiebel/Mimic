# :sparkles: Mimic - Rift

A server-side component for Mimic that powers automatic conduit discovery. Uses [Node](https://nodejs.org) and [TypeScript](https://www.typescriptlang.org). This component powers the automatic resolving of internal IPs, by serving a simple HTTP service backed by an SQLite database that pairs external with internal IPs.

## Development

You will need [Yarn](https://yarnpkg.com/lang/en/) for developing the rift component, and at least Node 7+ for the async-await components.

After checking out the source, run `yarn install` to install all dependencies. You will only need to do this after pulling updates from Github.

During development, you can use `yarn watch` to automatically compile TypeScript files once they are edited. However, it is recommended to simply use `yarn start` to start the application, since this will also compile all TypeScript files into Javascript files.

`yarn bundle` acts the same as `yarn watch`, except it will only compile the files once and not listen for edits.

## License

The rift component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.