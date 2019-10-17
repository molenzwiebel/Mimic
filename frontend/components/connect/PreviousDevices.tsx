import { deleteRegisteredComputer, getRegisteredComputers } from "../../utils/persistence";
import React, { useEffect, useState } from "react";
import socket from "../../utils/socket";
import styled from "styled-components/native";
import { ActionSheetIOS, ImageBackground, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import notchHeight, { bottomMargin } from "../../utils/notch";
import LCUButton from "../LCUButton";
import { Ionicons } from "@expo/vector-icons";
import confirm from "../../utils/confirm";

function DeviceEntry({ name, code, onDelete }: { name: string; code: string; onDelete: () => void }) {
    const maybeDeleteDevice = async () => {
        // Show action sheet on iOS, confirm on other devices.
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    title: "Remove '" + name + "' from the list of stored devices?",
                    options: ["Cancel", "Remove"],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0
                },
                buttonIndex => {
                    if (buttonIndex === 1) {
                        onDelete();
                    }
                }
            );
        } else {
            const response = await confirm("Are you sure?", "Remove '" + name + "' from the list of stored devices?");
            if (response) onDelete();
        }
    };

    return (
        <ComputerContainer onPress={() => socket.connect(code)} onLongPress={maybeDeleteDevice}>
            <Ionicons name="ios-desktop" size={30} color="#b6dbdb" />
            <ComputerText>
                <ComputerName>{name}</ComputerName>
                <ComputerCode>{code}</ComputerCode>
            </ComputerText>
            <DisclosureIcon name="ios-arrow-back" size={30} color="white" />
        </ComputerContainer>
    );
}

export default function PreviousDevices({ onRegisterNew }: { onRegisterNew: () => any }) {
    const [devices, setDevices] = useState<{ [key: string]: string }>({});
    useEffect(() => {
        getRegisteredComputers().then(setDevices);
    }, []);

    const removeDevice = (code: string) => {
        const clone = JSON.parse(JSON.stringify(devices));
        delete clone[code];
        setDevices(clone);
        deleteRegisteredComputer(code);
    };

    return (
        <Container>
            <Header>
                <Title>CONNECT TO A COMPUTER</Title>
                <Small>Long-press on an entry for more options.</Small>
            </Header>

            <ScrollView style={{ flex: 1, alignSelf: "stretch" }} alwaysBounceVertical={false}>
                {Object.entries(devices).map(entry => (
                    <DeviceEntry
                        name={entry[1]}
                        code={entry[0]}
                        key={entry[0]}
                        onDelete={() => removeDevice(entry[0])}
                    />
                ))}
            </ScrollView>

            <AddButton onClick={onRegisterNew}>Add new device</AddButton>
        </Container>
    );
}

const Container = styled(ImageBackground).attrs({
    source: require("../../assets/backgrounds/magic-background.jpg")
})`
    padding-top: ${notchHeight}px;
    padding-bottom: ${bottomMargin}px;
    flex: 1;
    flex-direction: column;
    align-items: center;
    height: 100%;
`;

const Header = styled(View)`
    align-self: stretch;
    border: 0px solid rgba(240, 230, 210, 0.4);
    border-bottom-width: 1px;
    padding: 10px;
    flex-direction: column;
`;

const Title = styled(Text)`
    font-family: LoL Display;
    font-size: 22px;
    color: #f0e6d3;
    font-weight: bold;
`;

const Small = styled(Text)`
    font-family: LoL Body;
    font-size: 14px;
    color: #aaaea0;
`;

const AddButton = styled(LCUButton)`
    margin: 10px 10px;
    align-self: stretch;
`;

const ComputerContainer = styled(TouchableOpacity)`
    width: 100%;
    padding: 10px;
    border: 0 solid rgba(205, 190, 147, 0.1);
    border-bottom-width: 1px;
    flex-direction: row;
    align-items: center;
`;

const ComputerText = styled(View)`
    margin-left: 10px;
    flex: 1;
    flex-direction: column;
    justify-content: center;
`;

const ComputerName = styled(Text)`
    font-family: LoL Display;
    font-size: 19px;
    color: #f0e6d3;
    font-weight: bold;
`;

const ComputerCode = styled(Text)`
    font-family: LoL Body;
    font-size: 14px;
    color: #aaaea0;
`;

const DisclosureIcon = styled(Ionicons)`
    transform: rotate(180deg);
    margin-left: 10px;
`;
