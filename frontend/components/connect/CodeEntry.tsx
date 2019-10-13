import { ImageBackground, StyleSheet, Text, View } from "react-native";
import styled from "styled-components/native";
import React, { useEffect, useState } from "react";
import * as Permissions from "expo-permissions";
import LCUButton from "../LCUButton";
import socket from "../../utils/socket";
import { BarCodeScanner, BarCodeScannedCallback } from "expo-barcode-scanner";
import notchHeight, { bottomMargin } from "../../utils/notch";

const QR_REGEX = /^https:\/\/remote\.mimic\.lol\/(\d+)$/;

export default function CodeEntry({ showIntro }: { showIntro: () => any }) {
    const [scannerState, setScannerState] = useState<boolean | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

    // Ask to use the camera.
    useEffect(() => {
        Permissions.askAsync(Permissions.CAMERA).then(({ status }) => {
            setScannerState(status === "granted");
        });
    }, []);

    const handleScanned: BarCodeScannedCallback = event => {
        const match = QR_REGEX.exec(event.data);
        if (!match) return;

        setHasScanned(true);
        socket.connect(match[1]);
    };

    return (
        <Container>
            <View>
                <Title>Welcome to Mimic!</Title>
                <IntroText>Scan your Mimic connection code to get started.</IntroText>
            </View>

            <ScannerContainer>
                {scannerState === null && <></>}
                {scannerState === false && (
                    <NoInstallText>
                        Mimic has no permission to use your camera. You can give it permission by going to the settings
                        app and enabling camera permissions for Mimic.
                    </NoInstallText>
                )}
                {scannerState === true && (
                    <BarCodeScanner
                        style={scannerStyles.scanner}
                        onBarCodeScanned={hasScanned ? (undefined as any) : handleScanned}
                    />
                )}
            </ScannerContainer>

            <BottomContainer>
                <NoInstallText>Don't have Mimic installed on your desktop yet?</NoInstallText>
                <IntroButton onClick={showIntro}>Show Instructions</IntroButton>
            </BottomContainer>
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
    justify-content: space-between;
    align-items: center;
    height: 100%;
`;

const Title = styled(Text)`
    font-family: LoL Display;
    font-size: 35px;
    text-align: center;
    margin-top: 40px;
    color: #f0e6d3;
`;

const IntroText = styled(Text)`
    font-family: LoL Body;
    font-size: 15px;
    color: #dcd2bf;
    text-align: center;
    margin: 10px 40px;
`;

const IntroButton = styled(LCUButton)`
    margin-bottom: 40px;
    width: 80%;
`;

const ScannerContainer = styled(View)`
    width: 80%;
    height: 50%;
    border: 1px solid white;
    align-items: center;
    justify-content: center;
`;

// This can't be a styled component. It breaks the scanner. ????
const scannerStyles = StyleSheet.create({
    scanner: {
        width: "100%",
        height: "100%"
    }
});

const BottomContainer = styled(View)`
    width: 100%;
    flex-direction: column;
    align-items: center;
`;

const NoInstallText = styled(Text)`
    font-family: LoL Body;
    font-size: 15px;
    text-align: center;
    color: #dcd2bf;
    margin: 0 20px 20px 10px;
    color: rgba(246, 236, 216, 0.6);
`;
