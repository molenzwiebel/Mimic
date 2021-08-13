import { default as React, useEffect, useState } from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import LCUCheckbox from "../LCUCheckbox";
import { withComputerConfig } from "../../utils/persistence";
import { updateNotificationSubscriptions } from "../../utils/notifications";
import * as Notifications from "expo-notifications";

async function assertNotificationsEnabled(): Promise<boolean> {
    const status = await Notifications.getPermissionsAsync();

    if (!status.granted && status.canAskAgain) {
        const response = await Notifications.requestPermissionsAsync();
        if (response.granted) return true;
    }

    if (!status.granted) {
        alert(
            "You have not granted Mimic the permission to send push notifications yet! Please go to your device settings and allow Mimic to send push notifications, then check back here!"
        );
        return false;
    }

    return true;
}

function QueuePushNotificationSetting() {
    const [isChecked, setChecked] = useState(false);

    useEffect(() => {
        withComputerConfig().then(x => setChecked(x.readyCheckNotificationsEnabled));
    }, []);

    const onToggle = async () => {
        const newValue = !isChecked;
        if (newValue && !(await assertNotificationsEnabled())) return;
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
        if (newValue && !(await assertNotificationsEnabled())) return;
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

export default function Settings() {
    return (
        <>
            <QueuePushNotificationSetting />
            <GamePushNotificationSetting />
        </>
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
