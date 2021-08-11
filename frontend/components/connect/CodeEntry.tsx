import React, { useEffect, useState } from "react";
import socket from "../../utils/socket";
import { Image, Text, View } from "react-native";
import styled from "styled-components/native";
import { BarCodeScannedCallback, BarCodeScanner } from "expo-barcode-scanner";
import { bottomMargin } from "../../utils/notch";

const QR_REGEX = /^https:\/\/remote\.mimic\.lol\/(\d+)$/;

function NoPermission() {
    return (
        <>
            <PoroImage source={require("../../assets/poros/poro-question.png")} />

            <NoInstallText>
                Mimic has no permission to use your camera. You can give it permission by going to the settings app and
                enabling camera permissions for Mimic.
            </NoInstallText>
        </>
    );
}

export default function CodeEntry({ onDone }: { onDone: () => any }) {
    const [scannerState, setScannerState] = useState<boolean | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

    // Ask to use the camera.
    useEffect(() => {
        BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
            setScannerState(status === "granted");
        });
    }, []);

    const handleScanned: BarCodeScannedCallback = event => {
        const match = QR_REGEX.exec(event.data);
        if (!match) return;

        setHasScanned(true);
        onDone();
        socket.connect(match[1]);
    };

    return (
        <Container>
            {scannerState === null && <></>}

            {scannerState === false && <NoPermission />}

            {scannerState === true && (
                <>
                    <BarCodeScanner
                        style={{ width: "100%", height: "100%" }}
                        onBarCodeScanned={hasScanned ? (undefined as any) : handleScanned}
                    />

                    <ScannerExplanationText>
                        Scan the QR code shown in the Mimic desktop application here. Don't have the application yet?
                        Download it from mimic.lol on your desktop.
                    </ScannerExplanationText>
                </>
            )}
        </Container>
    );
}

const Container = styled(View)`
    width: 100%;
    height: 100%;
    position: relative;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const PoroImage = styled(Image)`
    width: 200px;
    height: 200px;
`;

const ScannerExplanationText = styled(Text)`
    width: 100%;
    padding: 20px;
    text-align: center;
    margin-top: 20px;
    color: #aaaea0;
    position: absolute;
    bottom: ${20 + bottomMargin}px;
    background-color: rgba(0, 0, 0, 0.3);
`;

const NoInstallText = styled(Text)`
    max-width: 80%;

    text-align: center;
    margin-top: 20px;
    color: #aaaea0;
`;
