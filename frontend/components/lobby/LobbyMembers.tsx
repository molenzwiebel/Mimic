import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import React from "react";
import lobby, { LobbyMember } from "../../stores/lobby-store";
import { getPlayerAvatarURL, getRoleImage, POSITION_NAMES } from "../../utils/constants";
import { Ionicons } from "@expo/vector-icons";

function MemberActions({ member, showPositions }: { member: LobbyMember; showPositions: boolean }) {
    if (member.isLocalMember) {
        if (!showPositions) return <></>; // we can't moderate ourselves

        return (
            <MemberActionContainer>
                <TouchableOpacity onPress={() => lobby.toggleRoleOverlay(true)}>
                    <PositionImage source={getRoleImage(member.firstPositionPreference)} />
                </TouchableOpacity>
                {member.firstPositionPreference !== "FILL" && (
                    <TouchableOpacity onPress={() => lobby.toggleRoleOverlay(false)}>
                        <PositionImage source={getRoleImage(member.secondPositionPreference)} />
                    </TouchableOpacity>
                )}
            </MemberActionContainer>
        );
    }

    if (!lobby.state!.localMember.isLeader) return <></>; // can't do anything

    return (
        <MemberActionContainer>
            <TouchableOpacity onPress={() => lobby.promoteMember(member)}>
                <ActionIcon name="md-ribbon" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => lobby.toggleInvite(member)}>
                <ActionIcon name={member.allowedInviteOthers ? "md-person-add" : "md-person"} size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => lobby.kickMember(member)}>
                <ActionIcon name="ios-remove-circle" size={30} color="white" />
            </TouchableOpacity>
        </MemberActionContainer>
    );
}

function LobbyMemberEx({ member, showPositions }: { member: LobbyMember; showPositions: boolean }) {
    const avatar = getPlayerAvatarURL(member.summoner.profileIconId);

    const [first, second] = [member.firstPositionPreference, member.secondPositionPreference];
    let roleText;
    if (first === "UNSELECTED" && first === second) {
        roleText = "No Roles Selected";
    } else if (first !== "FILL") {
        roleText =
            POSITION_NAMES[first] +
            (second === "UNSELECTED" || lobby.state!.members.length === 5 ? "" : " - " + POSITION_NAMES[second]);
    } else {
        roleText = "Fill";
    }

    return (
        <MemberContainer>
            <Left>
                <Avatar source={{ uri: avatar }} />
                {member.isLeader && <Ionicons name="md-ribbon" size={20} color="white" style={{ marginLeft: 10 }} />}
                <MemberNameDetails>
                    <Name>{member.summoner.displayName}</Name>
                    {showPositions && !member.isLocalMember && <Positions>{roleText}</Positions>}
                </MemberNameDetails>
            </Left>

            <MemberActions member={member} showPositions={showPositions} />
        </MemberContainer>
    );
}

export default function LobbyMembers() {
    const lobbyMembers = [lobby.state!.localMember, ...lobby.state!.members.filter(x => !x.isLocalMember)];

    return (
        <Container>
            <ScrollView alwaysBounceVertical={false}>
                {lobbyMembers.map(member => (
                    <LobbyMemberEx
                        member={member}
                        showPositions={lobby.state!.gameConfig.showPositionSelector}
                        key={member.summonerId}
                    />
                ))}
                {lobby.state!.localMember.allowedInviteOthers && (
                    <TouchableOpacity onPress={() => lobby.toggleInviteOverlay()}>
                        <Invite>+ INVITE OTHERS</Invite>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </Container>
    );
}

const Container = styled(View)`
    width: 100%;
    flex: 1;
    flex-direction: column;
`;

const Invite = styled(Text)`
    width: 100%;
    text-align: center;
    font-size: 20px;
    margin-top: 5px;
    color: rgba(246, 236, 216, 0.6);
    font-family: "LoL Display";
    font-weight: 700;
    letter-spacing: 1.2px;
`;

const MemberContainer = styled(View)`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin: 0 8px;
    padding: 8px 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
`;

const Avatar = styled(Image)`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: 1px #ae8939;
`;

const Left = styled(View)`
    flex-direction: row;
    align-items: center;
`;

const MemberNameDetails = styled(View)`
    flex-direction: column;
    margin-left: 8px;
`;

const Name = styled(Text)`
    color: white;
    font-size: 20px;
`;

const Positions = styled(Text)`
    color: #f0e6d3;
    margin-right: 4px;
`;

const MemberActionContainer = styled(View)`
    align-items: center;
    flex-direction: row;
`;

const PositionImage = styled(Image)`
    width: 35px;
    height: 35px;
    margin-left: 10px;
`;

const ActionIcon = styled(Ionicons)`
    margin-left: 10px;
`;
