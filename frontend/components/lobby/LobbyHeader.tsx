import { View, Text, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import React from "react";
import lobby from "../../stores/lobby-store";
import queue from "../../stores/queue-store";
import { Ionicons } from "@expo/vector-icons";
import notchHeight from "../../utils/notch";
import { useObserver } from "mobx-react";

interface LobbyHeaderProps {
    onClose: () => any;
}

export default function LobbyHeader({ onClose }: LobbyHeaderProps) {
    return useObserver(() => {
        return <Container>
            <Info>
                <Header>Lobby</Header>
                <Details>{lobby.queueName} - {lobby.mapName}</Details>
            </Info>

            <TouchableOpacity onPress={onClose}>
                <Ionicons name="md-close" color="white" size={35} style={{ marginRight: 8 }}/>
            </TouchableOpacity>
        </Container>
    });
}

const Container = styled(View)`
    width: 100%;
    padding: 6px 8px;
    margin-top: ${notchHeight}px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(240, 230, 210, 0.2);
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
`;

const Info = styled(View)`
    flex-direction: column;
`;

const Header = styled(Text)`
    color: #f0e6d3;
    font-weight: bold;
    font-size: 20px;
`;

const Details = styled(Text)`
    color: #aaaea0;
    font-size: 18px;
`;