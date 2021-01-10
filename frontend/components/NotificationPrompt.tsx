import styled from "styled-components/native";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";
import { Image, ImageBackground, Text, View } from "react-native";
import React, { useState } from "react";
import { withComputerConfig } from "../utils/persistence";
import LCUButton from "./LCUButton";
import notchHeight from "../utils/notch";
import { updateNotificationSubscriptions } from "../utils/notifications";

export async function shouldShowNotificationPrompt(): Promise<boolean> {
    const settings = await withComputerConfig();
    const canPush = await Permissions.getAsync(Permissions.NOTIFICATIONS);

    return (
        !settings.hasPromptedForNotifications &&
        (canPush.status !== Permissions.PermissionStatus.DENIED || canPush.canAskAgain)
    );
}

const IMAGES = {
    ios: {
        image: require("../assets/notifications/ios.png"),
        width: 868,
        height: 1736
    },
    android: {
        image: require("../assets/notifications/android.png"),
        width: 724,
        height: 1488
    }
};

function NotificationImage({ width, height }: { width: number; height: number }) {
    const image = Constants.platform!.ios ? IMAGES.ios : IMAGES.android;
    const ratio = image.height / image.width;

    const renderWidth = Math.min(width - 40, image.width);
    const renderMargin = (width - renderWidth) / 2;
    const renderHeight = renderWidth * ratio;

    const style = {
        position: "absolute" as "absolute",
        width: renderWidth,
        left: 0,
        marginLeft: renderMargin,
        marginRight: renderMargin,
        top: height * 0.6,
        height: renderHeight
    };

    return <Image source={image.image} style={style} />;
}

export default function NotificationPrompt({ onClose }: { onClose: Function }) {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [processing, setProcessing] = useState(false);

    const onDismiss = async () => {
        await withComputerConfig(x => {
            x.hasPromptedForNotifications = true;
        });
        onClose();
    };

    const onAccept = async () => {
        setProcessing(true);
        await Permissions.askAsync(Permissions.NOTIFICATIONS);
        await withComputerConfig(x => {
            x.hasPromptedForNotifications = true;
            x.readyCheckNotificationsEnabled = true;
            x.gameStartNotificationsEnabled = true;
        });
        await updateNotificationSubscriptions();
        setProcessing(false);
        onClose();
    };

    return (
        <Background
            source={require("../assets/backgrounds/magic-background.jpg")}
            onLayout={ev => {
                setWidth(ev.nativeEvent.layout.width);
                setHeight(ev.nativeEvent.layout.height);
            }}>
            <ContentContainer style={{ height: height * 0.6, maxHeight: height * 0.6 }}>
                <Title>Push Notifications</Title>
                <Content>
                    Don't want to constantly monitor your phone for when queue pops? Turn on notifications and we'll let
                    you know when your queue is ready, so you can instantly accept.
                </Content>
                <Filler />
                <Disclaimer>We'll never send you promotional notifications that you didn't ask for.</Disclaimer>
                <Button type="confirm" onClick={onAccept} disabled={processing}>
                    Turn On
                </Button>
                <Button onClick={onDismiss}>Not Now</Button>
            </ContentContainer>
            <NotificationImage width={width} height={height} />
        </Background>
    );
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
`;

const ContentContainer = styled(View)`
    flex: 1;
    width: 100%;
    flex-direction: column;
    align-items: center;
`;

const Title = styled(Text)`
    margin-top: ${notchHeight}px;
    font-family: "LoL Display Bold";
    font-size: 34px;
    color: #f0e6d3;
    padding: 20px;
`;

const Content = styled(Text)`
    text-align: center;
    max-width: 90%;
    font-family: "LoL Body";
    color: #dcd2bf;
    font-size: 17px;
    margin-top: 10px;
`;

const Disclaimer = styled(Content)`
    font-size: 13px;
    width: 80%;
    margin-bottom: 10px;
`;

const Filler = styled(View)`
    flex: 1;
`;

const Button = styled(LCUButton)`
    width: 85%;
    margin-bottom: 20px;
`;
