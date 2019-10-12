import { observer } from "mobx-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, ScrollView, View, Image, Text, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import invites, { Invite } from "../../stores/invites-store";
import notchHeight from "../../utils/notch";
import AnimatedFlameBackground from "../AnimatedFlameBackground";
import { getPlayerAvatarURL } from "../../utils/constants";
import { Ionicons } from "@expo/vector-icons";

const HEIGHT = 105 + notchHeight;

const InviteEntry = ({ invite }: { invite: Invite }) => {
    return <InviteEntryContainer>
        <Avatar source={{ uri: getPlayerAvatarURL(invite.fromSummoner.profileIconId) }} />

        <Details>
            <Name>{ invite.fromSummoner.displayName }</Name>
            <Queue>{ (invite.queueName || "Unknown Queue") + " - " + (invite.mapName || "Unknown Map") }</Queue>
        </Details>

        <TouchableOpacity onPress={() => invites.acceptInvite(invite)}>
            <ActionButton name="md-checkmark" size={40} color="rgb(240, 230, 210)" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => invites.declineInvite(invite)}>
            <ActionButton name="md-close" size={40} color="rgb(240, 230, 210)" />
        </TouchableOpacity>
    </InviteEntryContainer>;
};

const InviteEntryContainer = styled(View)`
    flex-direction: row;
    align-items: center;
    margin: 10px 0;
`;

const Avatar = styled(Image)`
    width: 50px;
    height: 50px;
    border-radius: 25px;
    border: 1px #ae8939;
`;

const Details = styled(View)`
    flex-direction: column;
    flex: 1;
    margin: 0 10px;
`;

const Name = styled(Text)`
    font-family: "LoL Body";
    font-size: 22px;
    color: #f0e6d2;
`;

const Queue = styled(Text)`
    font-family: "LoL Body";
    font-size: 16px;
    color: #0acbe6;
`;

const ActionButton = styled(Ionicons)`
    margin-right: 10px;
`;

const InvitesContent = observer(() => {
    return <InviteContainer>
        <AnimatedFlameBackground height={HEIGHT} />

        <Header>GAME INVITES {invites.pendingInvites.length > 1 ? `(${invites.pendingInvites.length})` : ""}</Header>

        <ScrollView alwaysBounceVertical={false}>
            {invites.pendingInvites.map(x => <InviteEntry invite={x} key={x.invitationId} />)}
        </ScrollView>
    </InviteContainer>;
});

function Invites() {
    const hasInvites = invites.pendingInvites.length > 0;
    const height = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(height, {
            toValue: hasInvites ? HEIGHT : 0,
            duration: 300,
            easing: Easing.ease
        }).start();
    }, [hasInvites]);

    return <InviteContainerWrapper style={{ height }}>
        {hasInvites && <InvitesContent/>}
    </InviteContainerWrapper>;
}
export default observer(Invites as any);

const InviteContainerWrapper = styled(Animated.View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: hidden;
`;

const InviteContainer = styled(View)`
    height: ${HEIGHT}px;
    overflow: hidden;
    border: 0 solid #785a28;
    border-bottom-width: 3px;
    flex-direction: column;
    padding: 10px;
    padding-top: ${notchHeight > 0 ? notchHeight : 8}px;
`;

const Header = styled(Text)`
    font-family: "LoL Display Bold";
    color: #f0e6d3;
    font-size: 18px;
    letter-spacing: 1px;
`;

/*padding 20px 20px 10px 20px
        font-family "LoL Display"
        color #f0e6d3
        font-size 40px
        font-weight bold*/