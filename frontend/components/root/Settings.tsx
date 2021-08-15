import { default as React, useEffect, useState } from "react";
import { Text, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import LCUCheckbox from "../LCUCheckbox";
import { getMimicSettings, withComputerConfig, withMimicSettings } from "../../utils/persistence";
import { updateNotificationSubscriptions } from "../../utils/notifications";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";

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

function CheckboxWithTitle({
    isChecked,
    onToggle,
    children
}: {
    isChecked: boolean;
    onToggle: Function;
    children: string;
}) {
    const handleToggle = () => {
        if (Constants.platform?.ios) {
            Haptics.impactAsync();
        }

        onToggle();
    };

    return (
        <ElementAndName>
            <LCUCheckbox checked={isChecked} onToggle={handleToggle} />
            <TouchableWithoutFeedback onPress={handleToggle}>
                <Name>{children}</Name>
            </TouchableWithoutFeedback>
        </ElementAndName>
    );
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
            <CheckboxWithTitle isChecked={isChecked} onToggle={onToggle}>
                Enable Queue Push Notifications
            </CheckboxWithTitle>
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
            <CheckboxWithTitle isChecked={isChecked} onToggle={onToggle}>
                Enable Game Push Notifications
            </CheckboxWithTitle>
            <Description>
                Enabling this will send you a push notification when your game is about to start, unless you are already
                at your computer.
            </Description>
        </SettingContainer>
    );
}

function ReadyCheckVibrationSetting() {
    const [isChecked, setChecked] = useState(false);

    useEffect(() => {
        getMimicSettings().then(x => setChecked(!x.disableContinuousReadyCheckVibration));
    }, []);

    const onToggle = async () => {
        const newValue = !isChecked;
        setChecked(newValue);
        await withMimicSettings(x => {
            x.disableContinuousReadyCheckVibration = !newValue;
        });
    };

    return (
        <SettingContainer>
            <CheckboxWithTitle isChecked={isChecked} onToggle={onToggle}>
                Continuously Vibrate During Ready Check
            </CheckboxWithTitle>
            <Description>
                If enabled, your phone will continuously vibrate during ready check to alert you that you should
                respond. If disabled, your phone will only vibrate once at the start of the ready check.
            </Description>
        </SettingContainer>
    );
}

export default function Settings() {
    return (
        <>
            <QueuePushNotificationSetting />
            <GamePushNotificationSetting />
            <ReadyCheckVibrationSetting />
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
