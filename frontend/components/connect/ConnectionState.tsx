import { observer } from "mobx-react";
import { View, Text, Image, ImageBackground } from "react-native";
import styled from "styled-components/native";
import socket from "../../utils/socket";
import notchHeight, { bottomMargin } from "../../utils/notch";
import { RiftSocketState } from "../../utils/rift-socket";
import React from "react";
import LCUButton from "../LCUButton";

const NoDesktop = () => (
    <Container>
        <Title>Connection Failed</Title>
        <Poro source={require("../../assets/poros/poro-question.png")} />
        <Description>
            The computer with that code doesn't seem to be connected with Mimic right now. Make sure that both Conduit
            and League are running on the desktop computer, and that both your phone and your computer are connected to
            the internet.
        </Description>
        <Padding />
        <Button onClick={() => socket.tryReconnect()}>Try Again</Button>
        <Button onClick={() => socket.close()}>Cancel</Button>
    </Container>
);

const DesktopDenied = () => (
    <Container>
        <Title>Connection Denied</Title>
        <Poro source={require("../../assets/poros/poro-angry.png")} />
        <Description>
            You cannot connect to this computer right now because it explicitly denied the connection attempt. If this
            is your computer, ensure that you press ALLOW when Mimic asks if the connection should be allowed.
        </Description>
        <Padding />
        <Button onClick={() => socket.tryReconnect()}>Try Again</Button>
        <Button onClick={() => socket.close()}>Cancel</Button>
    </Container>
);

const Connecting = () => (
    <Container>
        <Title>Connecting</Title>
        <Poro source={require("../../assets/poros/poro-coolguy.png")} />
        <Description>
            Trying to connect to Mimic HQ... If this takes longer than a few seconds, check your phone's connection.
        </Description>
        <Padding />
        <Button type="deny" onClick={() => socket.close()}>
            Cancel
        </Button>
    </Container>
);

const Handshaking = () => (
    <Container>
        <Title>Waiting For Desktop</Title>
        <Poro source={require("../../assets/poros/poro-coolguy.png")} />
        <Description>
            Mimic is waiting for your desktop to approve the connection. Simply click the "Allow" button on your
            computer to accept the connection. Don't worry: you'll only have to do this once per device.
        </Description>
        <Padding />
        <Button type="deny" onClick={() => socket.close()}>
            Cancel
        </Button>
    </Container>
);

function ConnectionState() {
    if (socket.state === null) return null;

    const Element = {
        [RiftSocketState.CONNECTING]: Connecting,
        [RiftSocketState.CONNECTED]: () => null,
        [RiftSocketState.DISCONNECTED]: () => null,
        [RiftSocketState.FAILED_NO_DESKTOP]: NoDesktop,
        [RiftSocketState.HANDSHAKING]: Handshaking,
        [RiftSocketState.FAILED_DESKTOP_DENY]: DesktopDenied
    }[socket.state];

    return (
        <MainContainer>
            <Element />
        </MainContainer>
    );
}
export default observer(ConnectionState);

const MainContainer = styled(ImageBackground).attrs({
    source: require("../../assets/backgrounds/magic-background.jpg")
})`
    padding-top: ${notchHeight}px;
    padding-bottom: ${bottomMargin}px;
    flex: 1;
    height: 100%;
`;

const Container = styled(View)`
    flex: 1;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
`;

const Title = styled(Text)`
    font-family: LoL Display;
    font-size: 35px;
    text-align: center;
    margin-top: 40px;
    color: #f0e6d3;
`;

const Poro = styled(Image)`
    width: 200px;
    height: 200px;
    margin-top: 40px;
`;

const Description = styled(Text)`
    font-family: LoL Body;
    font-size: 17px;
    color: #dcd2bf;
    text-align: center;
    margin: 10px 40px;
`;

const Padding = styled(View)`
    flex: 1;
`;

const Button = styled(LCUButton)`
    margin-top: 10px;
    width: 80%;
`;
