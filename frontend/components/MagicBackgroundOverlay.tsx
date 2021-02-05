import React, { useEffect, useState } from "react";
import { BackHandler, ImageBackground, NativeEventSubscription, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FullscreenOverlay from "./FullscreenOverlay";
import styled from "styled-components/native";

interface MagicBackgroundOverlayProps {
    title: string;
    children: any;
    visible: boolean;
    marginTop: number;
    onClose: () => any;
}

export default function MagicBackgroundOverlay({
    title,
    children,
    visible,
    marginTop,
    onClose
}: MagicBackgroundOverlayProps) {
    const [registration, setRegistration] = useState<NativeEventSubscription | null>(null);

    // Close the modal if the back button is pressed.
    useEffect(() => {
        if (registration && !visible) registration.remove();

        if (visible) {
            setRegistration(
                BackHandler.addEventListener("hardwareBackPress", () => {
                    onClose();
                    return true;
                })
            );
        }

        return () => {
            if (registration) registration.remove();
        };
    }, [visible]);

    return (
        <FullscreenOverlay
            marginTop={marginTop}
            visible={visible}
            onClose={onClose}
            render={() => (
                <Background source={require("../assets/backgrounds/magic-background.jpg")}>
                    <Header>
                        <Close onPress={onClose}>
                            <Ionicons name="md-close" size={30} color="#f0e6d3" />
                        </Close>
                        <Title>{title}</Title>
                    </Header>

                    {children}
                </Background>
            )}
        />
    );
}

const Background = styled(ImageBackground)`
    width: 100%;
    height: 100%;
    flex-direction: column;
`;

const Header = styled(View)`
    border: 1px solid rgba(211, 211, 211, 0.1);
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
    align-items: center;
    padding: 10px;
    justify-content: center;
`;

const Close = styled(TouchableOpacity)`
    position: absolute;
    right: 15px;
`;

const Title = styled(Text)`
    color: #f0e6d3;
    font-family: "LoL Body";
    font-size: 25px;
`;
