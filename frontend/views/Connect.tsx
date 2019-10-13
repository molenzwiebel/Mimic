import React, { Component } from "react";
import { observer } from "mobx-react";
import { View, AsyncStorage, Text } from "react-native";
import { observable } from "mobx";
import socket from "../utils/socket";
import Intro from "../components/connect/Intro";
import styled from "styled-components/native";
import CodeEntry from "../components/connect/CodeEntry";
import ConnectionState from "../components/connect/ConnectionState";

@observer
export default class Connect extends Component {
    @observable
    showingIntro = false;

    constructor(props: {}) {
        super(props);

        socket.connect("498477");

        // Show intro if we haven't launched before.
        AsyncStorage.getItem("hasLaunched").then(result => {
            if (!result) this.showingIntro = true;
        });
    }

    private async showIntro() {
        await AsyncStorage.removeItem("hasLaunched");
        this.showingIntro = true;
    }

    private async dismissIntro() {
        await AsyncStorage.setItem("hasLaunched", "true");
        this.showingIntro = false;
    }

    render() {
        if (this.showingIntro) {
            return <Intro onDone={() => this.dismissIntro()} />;
        }

        if (socket.state !== null) {
            return <ConnectionState />;
        }

        return <CodeEntry showIntro={() => this.showIntro()} />;
    }
}

const Container = styled(View)`
    flex: 1;
    height: 100%;
`;
