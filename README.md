![Mimic Logo](assets/mimic-logo.png?raw=true)

[![Build Status](https://travis-ci.org/molenzwiebel/Mimic.svg?branch=master)](https://travis-ci.org/molenzwiebel/Mimic)
[![Mimic Discord](https://img.shields.io/badge/discord-Mimic-738bd7.svg?style=flat)](https://discord.gg/bfxdsRC)

# :satellite: Mimic
The new League client. Except it's on your phone.

Mimic is a different UI for the new League client that renders on your phone as a webpage instead of an application on your computer. It allows you to go through the game setup flow (from lobby until the end of champ select) from the safety of your toilet seat.

This repository contains the source code for Mimic. [Looking for the page with features and downloads instead?](https://mimic.lol)

## Developing Mimic

Mimic is composed of three different components: **web**, **conduit** and **rift**. Please read the appropriate READMEs in the subdirectories for information on how to develop for the platform.

- [**Web**](/web) is the user interface presented to users. It uses Vue with Typescript and handles the actual controlling of the client.

- [**Conduit**](/conduit) is the Windows application that redirects client traffic to the mobile website. It is written in C# and uses Websockets to connect to both the LCU and the mobile client.

- [**Rift**](/rift) is a Node/Express application that is responsible for tunneling a `Web <-> Conduit` connection through a central server. It also keeps track of the 6-digit codes issued to clients, doing so by signing JWT tokens. It does not get into contact with any raw data, since all traffic is end-to-end encrypted.

## License

Mimic and all of its components are released under the [MIT](https://github.com/molenzwiebel/Mimic/blob/master/LICENSE) license. Feel free to browse through the code as you like, and if you end up making any improvements or changes, please do not hesitate to make a pull request. :)
