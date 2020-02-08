import styled from "styled-components/native";
import Permissions, { PermissionStatus } from "expo-permissions";
import { ImageBackground } from "react-native";
import React from "react";
import { withComputerConfig } from "../utils/persistence";

export async function shouldShowNotificationPrompt(): Promise<boolean> {
    const settings = await withComputerConfig();
    const canPush = await Permissions.getAsync(Permissions.NOTIFICATIONS);

    return !settings.hasPromptedForNotifications && canPush.status !== PermissionStatus.DENIED;
}

export default function NotificationPrompt({
    onCreate,
    onJoin,
    onSettings
}: {
    onCreate: Function;
    onJoin: Function;
    onSettings: Function;
}) {
    return (
        <Background source={require("../assets/backgrounds/magic-background.jpg")}>

        </Background>
    );
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;
