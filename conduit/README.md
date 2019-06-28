# :electric_plug: Mimic - Conduit

Client-side C# Windows application that handles the connection between the LCU and the mobile website by acting as a "passthrough" for messages. It uses [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to communicate with a central hub server that is responsible for tunneling connections to the phones. A locally stored signed JWT is used to identify the computer through its 6 digit identifier. All messages except for the discovery/registration messages are encrypted with a key that only the mobile connection and Conduit knows, for extra security. Conduit detects the League client by querying the list of active processes periodically.

## Development

Simply opening the `MimicConduit.sln` file in [Visual Studio](https://www.visualstudio.com) should install all dependencies via NuGet and be ready to go. Packaging for release is as simple as choosing the release target and building, since Fody.Costura will automatically include the required .dlls in the resulting exe.

## License

The conduit component of Mimic is released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. See the index README for more info.
