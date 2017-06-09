# :electric_plug: Mimic - Conduit

Client-side C# Windows application that handles the connection between the LCU and the mobile website by acting as a "passthrough" for messages. It uses [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to communicate between the different instances. It monitors the current League status by querying the `lockfile` file that is created whenever the LCU process is running.

## Development

Simply opening the `MimicConduit.sln` file in [Visual Studio](https://www.visualstudio.com) should install all dependencies via NuGet and be ready to go. Packaging for release is as simple as choosing the release target and building, since Fody.Costura will automatically include the required .dlls in the resulting exe.

## License

The conduit component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.