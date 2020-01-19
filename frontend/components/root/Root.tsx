import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { useObserver } from "mobx-react-lite";
import socket from "../../utils/socket";
import { Ionicons } from "@expo/vector-icons";
import styled from "styled-components/native";
import React from "react";
import { bottomMargin } from "../../utils/notch";

function HeaderIntro() {
    return (
        <>
            <Header>No Lobby</Header>
            <Detail>
                You're not currently in a lobby. Wait for one of your friends to send you an invite, or choose one of
                the options below to get into game!
            </Detail>
        </>
    );
}

function CreateLobby({ onCreate }: { onCreate: Function }) {
    return (
        <OptionContainer onPress={() => onCreate()} first>
            <ButtonIcon source={require("../../assets/icons/create-party.png")} />
            <OptionText>CREATE A LOBBY</OptionText>
        </OptionContainer>
    );
}

function JoinLobby({ onJoin }: { onJoin: Function }) {
    return (
        <OptionContainer onPress={() => onJoin()}>
            <ButtonIcon source={require("../../assets/icons/open-party-join.png")} />
            <OptionText>JOIN A LOBBY</OptionText>
        </OptionContainer>
    );
}

function Footer({ onSettings }: { onSettings: Function }) {
    return useObserver(() => (
        <FooterContainer>
            <ComputerName>{socket.computerName}</ComputerName>
            <TouchableOpacity onPress={() => onSettings()}>
                <Ionicons name="md-settings" size={30} color="#cdbe91" />
            </TouchableOpacity>
        </FooterContainer>
    ));
}

export default function Root({
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
            <WrapperContainer>
                <HeaderIntro />
                <CreateLobby onCreate={onCreate} />
                <JoinLobby onJoin={onJoin} />
            </WrapperContainer>
            <Footer onSettings={onSettings} />
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

const WrapperContainer = styled(View)`
    flex: 1;
    width: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const FooterContainer = styled(View)`
    width: 100%;
    border: 0px solid rgb(120, 90, 40);
    border-top-width: 1px;
    padding: 10px 20px;
    padding-bottom: ${bottomMargin + 10}px;
    flex-direction: row;
    align-items: center;
`;

const ComputerName = styled(Text)`
    flex: 1;
    font-family: "LoL Body";
    font-size: 18px;
    color: #f0e6d3;
`;

const Header = styled(Text)`
    color: #f0e6d3;
    font-family: "LoL Display Bold";
    letter-spacing: 1.2px;
    font-size: 35px;
    width: 100%;
    text-align: center;
`;

const Detail = styled(Text)`
    margin-top: 10px;
    color: #aaaea0;
    width: 90%;
    font-family: "LoL Body";
    font-size: 18px;
    text-align: center;
`;

const OptionContainer: any = styled(TouchableOpacity)`
    width: 100%;
    padding: 20px 10px;
    background-color: rgb(4, 14, 23);
    flex-direction: row;
    align-items: center;
    margin-top: ${(props: any) => (props.first ? 20 : 0)}px;
    border: 0px solid rgba(255, 255, 255, 0.2);
    border-bottom-width: ${(props: any) => (props.first ? 1 : 0)}px;
`;

const ButtonIcon = styled(Image)`
    width: 45px;
    height: 45px;
    margin-left: 10px;
`;

const OptionText = styled(Text)`
    font-family: "LoL Display Bold";
    font-size: 22px;
    margin-left: 10px;
    color: #cdbe91;
`;
