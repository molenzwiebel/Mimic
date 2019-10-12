import React, { Component } from "react";
import { observer } from "mobx-react";
import Constants from "expo-constants";
import socket from "../utils/socket";
import { Dimensions, ImageBackground, StyleSheet, Text, TextInput } from "react-native";
import { observable } from "mobx";
import LCUButton from "../components/LCUButton";

@observer
export default class Connect extends Component {
    @observable
    hostname = "192.168.1.108";

    constructor(props: {}) {
        super(props);

        socket.connect(this.hostname);
    }

    render() {
        return (
            <ImageBackground style={styles.container} source={require("../assets/magic-background.jpg")}>
                <Text style={styles.header}>Welcome to Mimic!</Text>
                <Text style={styles.subheader}>How would you like to connect?</Text>

                <TextInput
                    style={[styles.almostFullWidth, styles.input]}
                    value={this.hostname}
                    onChangeText={text => (this.hostname = text)}
                />

                <LCUButton
                    style={[styles.almostFullWidth, { marginTop: 10 }]}
                    onClick={() => socket.connect(this.hostname)}>
                    Connect
                </LCUButton>
            </ImageBackground>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        flex: 1,
        flexDirection: "column",
        alignItems: "center"
    },
    header: {
        fontSize: 30,
        color: "#f0e6d3",
        paddingTop: 30 + Constants.statusBarHeight,
        paddingBottom: 10,
        fontFamily: "LoL Display"
    },
    subheader: {
        fontSize: 20,
        color: "#dcd2bf",
        fontFamily: "LoL Display"
    },

    almostFullWidth: {
        width: Dimensions.get("window").width - 20,
        marginLeft: 10,
        marginRight: 10
    },

    input: {
        height: 45,
        paddingLeft: 5,
        color: "#f0e6d2",
        backgroundColor: "black",
        borderWidth: 1,
        borderStyle: "solid",
        marginTop: 40,
        fontSize: 16,
        borderColor: "#785a28"
    }
});
