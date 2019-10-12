import { ImageBackground, Text } from "react-native";
import styled from "styled-components/native";
import React from "react";

export default function NoLobby() {
    return (
        <Background source={require("../../assets/magic-background.jpg")}>
            <Header>NO LOBBY</Header>
            <Detail>Wait for an invite, or join a{"\n"}lobby on your desktop.</Detail>
        </Background>
    )
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    align-items: center;
    justify-content: center;
`;

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