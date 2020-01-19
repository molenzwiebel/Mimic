import { ImageBackground, Text, View } from "react-native";
import styled from "styled-components/native";
import React from "react";

function CreateLobby({ onCreate }: { onCreate: Function }) {
    return <CreateContainer></CreateContainer>;
}

function JoinLobby({ onJoin }: { onJoin: Function }) {
    return <CreateContainer></CreateContainer>;
}

function Footer({ onSettings }: { onSettings: Function }) {
    return <FooterContainer></FooterContainer>;
}

export default function NoLobby({
    onCreate,
    onJoin,
    onSettings
}: {
    onCreate: Function;
    onJoin: Function;
    onSettings: Function;
}) {
    return (
        <Background source={require("../../assets/backgrounds/magic-background.jpg")}>
            <CreateLobby onCreate={onCreate} />
            <JoinLobby onJoin={onJoin} />
            <Footer onSettings={onSettings} />
        </Background>
    );
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    flex-direction: row;
`;

const CreateContainer = styled(View)`
    flex: 1;
`;

const JoinContainer = styled(View)`
    flex: 1;
`;

const FooterContainer = styled(View)``;

const Header = styled(Text)`
    color: #f0e6d3;
    font-family: "LoL Display Bold";
    letter-spacing: 1.2px;
    font-size: 35px;
`;

const Detail = styled(Text)`
    margin-top: 10px;
    color: #aaaea0;
    font-family: "LoL Body";
    font-size: 20px;
    text-align: center;
`;
