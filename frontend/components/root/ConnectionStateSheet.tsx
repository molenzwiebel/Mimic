import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styled from "styled-components/native";
import React from "react";
import socket from "../../utils/socket";
import { observer } from "mobx-react";

export const CONNECTION_STATE_SHEET_HEIGHT = 300;

const Ping = observer(() => {
    let color = "";
    if (socket.ping < 150) {
        color = "#43b581";
    } else if (socket.ping < 350) {
        color = "#faa61a";
    } else {
        color = "#f04747";
    }

    return <Text style={{ color }}>{socket.ping}ms</Text>;
});

const DeviceAndPing = observer(() => {
    return (
        <VersionDescription>
            Connected to {socket.computerName}
            {"\n"}
            Mimic Conduit v{socket.computerVersion}
            {"\n"}
            Ping: <Ping />
        </VersionDescription>
    );
});

function DisconnectItem() {
    return (
        <DisconnectContainer
            onPress={() => {
                console.log("close!??");
                socket.close();
            }}>
            <DisconnectIconContainer>
                <MaterialCommunityIcons name="close-network-outline" size={22} color="#f04747" />
            </DisconnectIconContainer>

            <DisconnectTextContainer>
                <DisconnectText>Disconnect</DisconnectText>
            </DisconnectTextContainer>
        </DisconnectContainer>
    );
}

export default function ConnectionStateSheet() {
    return (
        <Container>
            <Title>Connection Status</Title>

            <Divider />

            <DeviceAndPing />

            <Divider />

            <DisconnectItem />
        </Container>
    );
}

const Title = styled(Text)`
    font-family: LoL Display Bold;
    font-size: 20px;
    color: #f0e6d3;
    font-weight: bold;
    margin: 10px;
`;

const Container = styled(View)`
    height: ${CONNECTION_STATE_SHEET_HEIGHT}px;
    border: 0 solid #644d1c;
    border-top-width: 3px;
    background-color: #111216;
`;

const Divider = styled(View)`
    width: 100%;
    height: 1px;
    background-color: #aaaea0;
    opacity: 0.2;
`;

const VersionDescription = styled(Text)`
    font-family: "LoL Body";
    font-size: 14px;
    color: #aaaea0;
    margin: 10px;
    line-height: 20px;
`;

const DisconnectContainer = styled(TouchableOpacity)`
    margin: 15px;
    width: 100%;
    flex-direction: row;
`;

const DisconnectIconContainer = styled(View)`
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-right: 15px;
`;

const DisconnectTextContainer = styled(View)`
    flex: 1;
    flex-direction: column;
    justify-content: center;
`;

const DisconnectText = styled(Text)`
    font-family: LoL Body;
    font-size: 17px;
    color: #f04747;
`;
