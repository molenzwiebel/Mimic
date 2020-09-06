import { default as React, useEffect, useState } from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import { Updates } from "expo";
import Constants from "expo-constants";
import socket from "../../utils/socket";
import RootSubview from "./RootSubview";
import styled from "styled-components/native";
import LCUCheckbox from "../LCUCheckbox";
import LCUButton from "../LCUButton";
import confirm from "../../utils/confirm";
import { withComputerConfig } from "../../utils/persistence";
import { bottomMargin } from "../../utils/notch";
import { updateNotificationSubscriptions } from "../../utils/notifications";

function QueuePushNotificationSetting() {
    const [isChecked, setChecked] = useState(false);

    useEffect(() => {
        withComputerConfig().then(x => setChecked(x.readyCheckNotificationsEnabled));
    }, []);

    const onToggle = async () => {
        const newValue = !isChecked;
        setChecked(newValue);
        await withComputerConfig(x => {
            x.readyCheckNotificationsEnabled = newValue;
        });
        await updateNotificationSubscriptions();
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

    useEffect(() => {
        withComputerConfig().then(x => setChecked(x.gameStartNotificationsEnabled));
    }, []);

    const onToggle = async () => {
        const newValue = !isChecked;
        setChecked(newValue);
        await withComputerConfig(x => {
            x.gameStartNotificationsEnabled = newValue;
        });
        await updateNotificationSubscriptions();
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

function Version() {
    const [status, setStatus] = useState("Check for updates");

    const checkForUpdate = async () => {
        setStatus("Checking...");
        const status = await Updates.checkForUpdateAsync();
        if (!status.isAvailable) {
            setStatus("No New Updates");
            return;
        }
        setStatus("Downloading v" + status.manifest.version);
        await Updates.fetchUpdateAsync();
        setStatus("Relaunching");
        await Updates.reloadFromCache();
    };

    return <SettingContainer>
        <TouchableWithoutFeedback onPress={checkForUpdate}>
            <VersionDescription>Mimic Mobile v{ Constants.manifest.version } - <Underlined>{status}</Underlined></VersionDescription>
        </TouchableWithoutFeedback>
    </SettingContainer>;
}

export default function Settings({ onClose }: { onClose: Function }) {
    return (
        <RootSubview title="Settings" onClose={onClose}>
            <QueuePushNotificationSetting />
            <GamePushNotificationSetting />
            <DisconnectSetting />
            <Padder />
            <Version/>
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

const Padder = styled(View)`
    flex: 1;
`;

const VersionDescription = styled(Description)`
    text-align: center;
    margin-bottom: ${bottomMargin}px;
`;

const Underlined = styled(Text)`
    text-decoration: underline #aaaea0;
`;