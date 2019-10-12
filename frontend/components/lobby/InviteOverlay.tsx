import lobby, { InvitationMetadata } from "../../stores/lobby-store";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { observer } from "mobx-react";
import { Ionicons } from "@expo/vector-icons";
import styled from "styled-components/native";
import socket from "../../utils/socket";
import suggestedPlayers, { InvitationSuggestion } from "../../stores/suggested-players-store";
import CircularLCUButton from "../CircularLCUButton";
import MagicBackgroundOverlay from "../MagicBackgroundOverlay";

const InviteForm = () => {
    const [text, setText] = useState("");

    const invite = async () => {
        const data = await socket.request("/lol-summoner/v1/summoners?name=" + encodeURI(text));
        if (data.status !== 200) {
            alert("Summoner " + text + " was not found. Did you spell the name correctly?");
            return;
        }

        await lobby.invitePlayer(data.content.summonerId);
        setText(""); // clear field
    };

    return (
        <Invite>
            <SummonerNameInput value={text} onChangeText={setText} placeholder="Summoner Name" />
            <CircularLCUButton onClick={invite} size={35} style={{ marginRight: 8 }}>
                <Ionicons name="md-add" size={20} color="#cebf93" />
            </CircularLCUButton>
        </Invite>
    );
};

const InvitedPlayer = observer(({ player }: { player: InvitationMetadata }) => (
    <Player>
        <Ionicons
            name={
                {
                    Pending: "ios-more",
                    Kicked: "md-close",
                    Declined: "md-close",
                    Accepted: "md-checkmark"
                }[player.state] || "ios-more"
            }
            size={20}
            color="white"
        />
        <Name>{player.toSummoner.displayName}</Name>
    </Player>
));

const InvitablePlayer = ({ suggestion }: { suggestion: InvitationSuggestion }) => (
    <TouchableOpacity onPress={() => lobby.invitePlayer(suggestion.summonerId)}>
        <Player>
            <Ionicons name="md-add" size={20} color="white" />
            <Name>{suggestion.summonerName}</Name>
        </Player>
    </TouchableOpacity>
);

const InviteOverlayContent = observer(() => {
    return (
        <>
            <InviteForm />

            <SectionHeader>INVITED</SectionHeader>
            <ScrollView alwaysBounceVertical={false} style={{ flex: 1 }}>
                {lobby.state!.invitations.map(x => (
                    <InvitedPlayer player={x} key={x.toSummonerId} />
                ))}
            </ScrollView>

            <SectionHeader>SUGGESTED</SectionHeader>
            <ScrollView alwaysBounceVertical={false} style={{ flex: 1 }}>
                {suggestedPlayers.suggestions.map(x => (
                    <InvitablePlayer suggestion={x} key={x.summonerId} />
                ))}
            </ScrollView>
        </>
    );
});

function InviteOverlay() {
    return (
        <MagicBackgroundOverlay
            title="Invites"
            visible={lobby.inviteOverlayOpen}
            marginTop={60}
            onClose={() => lobby.toggleInviteOverlay()}>
            <InviteOverlayContent />
        </MagicBackgroundOverlay>
    );
}

export default observer(InviteOverlay as any);

const Invite = styled(View)`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const SummonerNameInput = styled(TextInput)`
    flex: 1;
    height: 40px
    padding-left: 5px;
    background-color: black;
    font-family: "LoL Body";
    border: 1px solid #785a28;
    margin: 8px;
    font-size: 15px;
    color: #f0e6d3;
`;

const SectionHeader = styled(Text)`
    font-family: "LoL Display Bold";
    font-size: 13px;
    margin-top: 10px;
    margin-left: 8px;
    color: #f0e6d2;
    letter-spacing: 1.2px;
`;

const Player = styled(View)`
    margin: 5px 10px;
    padding: 8px 0;
    border: 1px solid rgba(205, 190, 147, 0.2);
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
    flex-direction: row;
    align-items: center;
`;

const Name = styled(Text)`
    margin-left: 10px;
    font-family: "LoL Body";
    color: #f0e6d3;
    font-size: 18px;
`;
