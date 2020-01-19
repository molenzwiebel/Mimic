import { default as React, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BackHandler, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import notchHeight from "../../utils/notch";

function Header({ onClose, title }: { onClose: Function; title: string }) {
    return (
        <HeaderView>
            <TouchableOpacity onPress={() => onClose()}>
                <Ionicons name="ios-arrow-back" size={35} color="#efe5d1" />
            </TouchableOpacity>

            <HeaderText>{title}</HeaderText>
        </HeaderView>
    );
}

export default function RootSubview({ onClose, title, children }: { onClose: Function; title: string; children: any }) {
    useEffect(() => {
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            onClose();
        });

        return () => {
            handler.remove();
        };
    });

    return (
        <Background source={require("../../assets/backgrounds/magic-background.jpg")}>
            <Header onClose={onClose} title={title} />
            {children}
        </Background>
    );
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
`;

const HeaderView = styled(View)`
    width: 100%;
    align-items: center;
    flex-direction: row;
    padding: 10px 20px;
    padding-top: ${notchHeight + 10}px;
    border: 0px solid white;
    border-bottom-width: 1px;
    background-color: rgba(0, 0, 0, 0.7);
`;

const HeaderText = styled(Text)`
    margin-left: 20px;
    font-size: 26px;
    font-family: "LoL Display Bold";
    color: #f0d9a3;
`;
