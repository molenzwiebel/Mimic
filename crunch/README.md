# ![](https://i.imgur.com/MOC62MT.png) :package: Mimic - Crunch

Crunch is a tool for automatically building asset bundles needed for the Mimic app directly from the League CDN. It _crunches_ the direct bundles used in the client into a release bundle that can be statically hosted and is optimized for caching and lazy loading.

# Development
Crunch is written in C# using the .NET Core toolkit. You will need the `dotnet` CLI binary in order to develop Crunch. Instructions on how to install it for various platforms can be found [here](https://docs.microsoft.com/en-us/dotnet/core/install/).

After checking out the source, run `dotnet run` to download dependencies, compile crunch and run the resulting binary. You can do this on all supported dotNET platforms (Windows, Linux, macOS).

# License
The Crunch component of Mimic is released under the MIT license. See the index README for more info.