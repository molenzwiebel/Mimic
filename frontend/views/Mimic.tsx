import { useObserver } from "mobx-react";
import * as React from "react";
import { ImageBackground } from "react-native";
import styled from "styled-components/native";
import queue from "../stores/queue-store";
import lobby from "../stores/lobby-store";
import champSelect from "../stores/champ-select-store";

import socket from "../utils/socket";
import ChampionSelect from "./ChampionSelect";

import Connect from "./Connect";
import Invites from "./Invites";
import Lobby from "./Lobby";
import ReadyCheck from "./ReadyCheck";
import Root from "./Root";
import ConnectionState from "../components/connect/ConnectionState";
import { useEffect } from "react";
import { withComputerConfig } from "../utils/persistence";

// Observes state of the current summoner name and updates the config storage accordingly.
function SummonerNameObserver() {
    useEffect(() => {
        socket.observe("/lol-chat/v1/me", data => {
            withComputerConfig(config => {
                config.lastAccount = {
                    summonerName: data.content.name,
                    iconId: data.content.icon
                };
            });
        });

        return () => {
            socket.unobserve("/lol-chat/v1/me");
        };
    });

    return null;
}

/**
 * This is the main root object that is responsible for rendering the application
 * once all assets are loaded and ready to go. It is responsible for controlling
 * which components are currently on screen.
 */
export default function Mimic() {
    return useObserver(() => {
        // If we have no socket connection, return the connect screen.
        if (!socket.connected) {
            return (
                <Container source={require("../assets/backgrounds/magic-background.jpg")}>
                    <Connect />
                </Container>
            );
        }

        // If we're connecting right now, show the state.
        if (!socket.connected && socket.state !== null) {
            return (
                <Container source={require("../assets/backgrounds/magic-background.jpg")}>
                    <ConnectionState />
                </Container>
            );
        }

        const inChampionSelect = champSelect.state !== null;
        const hasLobby = lobby.state !== null;

        // We can accept invites if we're not in queue or in champion select.
        const canAcceptInvites = (!queue.state || !queue.state.isCurrentlyInQueue) && !inChampionSelect;

        // Else, return a view that contains...
        return (
            <Container source={require("../assets/backgrounds/magic-background.jpg")}>
                {/* The root view, if we're not currently in a lobby or in champ select. */}
                {!inChampionSelect && !hasLobby && <Root />}

                {/* The current lobby, if we're not currently in champion select but in a lobby.. */}
                {!inChampionSelect && hasLobby && <Lobby />}

                {/* The champion select, if we're currently in one.*/}
                {inChampionSelect && <ChampionSelect />}

                {/* The list of pending invites, if we are currently in a position to accept them. */}
                {canAcceptInvites && <Invites />}

                {/* The absolutely positioned ready check. It will hide/show based on if there is currently one ongoing.*/}
                {<ReadyCheck />}

                {/* Needed to update the local summoner for the previous devices list. */}
                {<SummonerNameObserver />}
            </Container>
        );
    });
}

const Container = styled(ImageBackground)`
    width: 100%;
    height: 100%;
    overflow: hidden;
    flex-direction: column;
`;
