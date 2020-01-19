import React from "react";
import { useObserver } from "mobx-react";
import { ImageBackground, View } from "react-native";
import styled from "styled-components/native";
import LobbyHeader from "../components/lobby/LobbyHeader";
import LCUButton from "../components/LCUButton";
import LobbyMembers from "../components/lobby/LobbyMembers";
import lobby from "../stores/lobby-store";
import queue from "../stores/queue-store";
import InviteOverlay from "../components/lobby/InviteOverlay";
import RoleOverlay from "../components/lobby/RoleOverlay";
import QueueStatus from "../components/lobby/QueueStatus";
import QueueDarkenedOverlay from "../components/lobby/QueueDarkenedOverlay";
import { bottomMargin } from "../utils/notch";

export default function Lobby() {
    return useObserver(() => {
        // Should never happen.
        if (!lobby.state) return <></>;

        return (
            <Container source={lobby.backgroundImage}>
                <View style={{ flex: 1 }}>
                    <LobbyHeader onClose={() => lobby.leaveLobby()} />
                    <LobbyMembers />
                </View>

                <QueueButton disabled={!lobby.state.canStartActivity} onClick={() => queue.joinQueue()}>
                    Find Match
                </QueueButton>

                {/* Absolute Positioned Elements */}
                <InviteOverlay />
                <RoleOverlay />
                <QueueDarkenedOverlay />
                <QueueStatus />
            </Container>
        );
    });
}

const Container = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    padding-bottom: ${bottomMargin}px;
`;

const QueueButton = styled(LCUButton)`
    margin: 6px;
`;
