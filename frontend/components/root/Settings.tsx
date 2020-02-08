import { default as React, useState } from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import socket from "../../utils/socket";
import RootSubview from "./RootSubview";
import styled from "styled-components/native";
import LCUCheckbox from "../LCUCheckbox";
import LCUButton from "../LCUButton";
import confirm from "../../utils/confirm";
import { withComputerConfig } from "../../utils/persistence";
import { updateNotificationTokens } from "../../utils/notifications";

function QueuePushNotificationSetting() {
    const [isChecked, setChecked] = useState(false);
    const onToggle = () => {
        const newValue = !isChecked;
        setChecked(newValue);
        withComputerConfig(x => {
            x.readyCheckNotificationsEnabled = newValue;
        });
        updateNotificationTokens();
    };

    return (
        <SettingContainer>
            <ElementAndName>
                <LCUCheckbox checked={isChecked} onToggle={onToggle} />
                <TouchableWithoutFeedback onPress={onToggle}>
                    <Name>Enable Queue Push Notifications</Name>
                </TouchableWithoutFeedback>
            </ElementAndName>
            <Description>Enabling this will send you a push notification whenever your queue pops.</Description>
        </SettingContainer>
    );
}

function GamePushNotificationSetting() {
    const [isChecked, setChecked] = useState(false);
    const onToggle = () => {
        const newValue = !isChecked;
        setChecked(newValue);
        withComputerConfig(x => {
            x.gameStartNotificationsEnabled = newValue;
        });
        updateNotificationTokens();
    };

    return (
        <SettingContainer>
            <ElementAndName>
                <LCUCheckbox checked={isChecked} onToggle={onToggle} />
                <TouchableWithoutFeedback onPress={onToggle}>
                    <Name>Enable Game Push Notifications</Name>
                </TouchableWithoutFeedback>
            </ElementAndName>
            <Description>
                Enabling this will send you a push notification when your game is about to start, unless you are already
                at your computer.
            </Description>
        </SettingContainer>
    );
}

function DisconnectSetting() {
    const disconnect = async () => {
        if (!(await confirm("Are you sure?", "Do you want to disconnect from " + socket.computerName + "?"))) return;
        socket.close();
    };

    return (
        <SettingContainer>
            <LCUButton type="deny" onClick={disconnect}>
                Disconnect
            </LCUButton>
            <Description>
                Currently connected to {socket.computerName} running Mimic Conduit v{socket.computerVersion}.
            </Description>
        </SettingContainer>
    );
}

export default function Settings({ onClose }: { onClose: Function }) {
    return (
        <RootSubview title="Settings" onClose={onClose}>
            <QueuePushNotificationSetting />
            <GamePushNotificationSetting />
            <DisconnectSetting />
        </RootSubview>
    );
}

const SettingContainer = styled(View)`
    width: 100%;
    padding: 15px;
    flex-direction: column;
`;

const ElementAndName = styled(View)`
    flex-direction: row;
    align-items: center;
`;

const Name = styled(Text)`
    margin-left: 10px;
    font-family: "LoL Body";
    font-size: 22px;
    color: #f0e6d3;
`;

const Description = styled(Text)`
    font-family: "LoL Body";
    font-size: 14px;
    color: #aaaea0;
    margin-top: 4px;
`;
