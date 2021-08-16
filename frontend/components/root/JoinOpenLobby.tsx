import { default as React, useState } from "react";
import { observer } from "mobx-react";
import { Image, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import store, { Friend, Party } from "../../stores/friends-list-store";
import { profileIconPath } from "../../utils/assets";
import ABImage from "../assets/ABImage";

function NoOpenLobbies() {
    return (
        <NoOpenLobbiesContainer>
            <Poro source={require("../../assets/poros/poro-sad.png")} />
            <NoOpenLobbiesText>Nobody in your friends list is hosting an open lobby right now.</NoOpenLobbiesText>
        </NoOpenLobbiesContainer>
    );
}

function JoinLobbyButton({ onPress }: { onPress: any }) {
    const [isHover, setHover] = useState(false);
    const image = isHover
        ? require("../../assets/icons/open-party-join-active.png")
        : require("../../assets/icons/open-party-join.png");

    return (
        <TouchableWithoutFeedback
            onPressIn={() => setHover(true)}
            onPressOut={() => setHover(false)}
            onPress={() => {
                setHover(false);
                onPress();
            }}>
            <JoinButton source={image} />
        </TouchableWithoutFeedback>
    );
}

const OnlineFriend = observer(({ friend }: { friend: Friend }) => {
    const party: Party = JSON.parse(friend.lol!.pty!);
    const queue = store.queues.find(x => x.id === party.queueId)!;
    if (!queue) return <></>;
    const text = `${party.summoners.length}/${queue.maximumParticipantListSize} - ${queue.shortName}`;
    const avatarURL = profileIconPath(friend.icon);

    return (
        <GoldBorderedElement onPress={() => store.joinFriend(friend)}>
            <Avatar path={avatarURL} />
            <NameAndStatus>
                <Name>{friend.name}</Name>
                <Status>{text}</Status>
            </NameAndStatus>
            <JoinLobbyButton onPress={() => store.joinFriend(friend)} />
        </GoldBorderedElement>
    );
});

export default observer(() => {
    if (!store.friendsWithParties.length) {
        return <NoOpenLobbies />;
    }

    return (
        <>
            {store.friendsWithParties.map(x => (
                <OnlineFriend friend={x} key={x.name} />
            ))}
        </>
    );
});

const NoOpenLobbiesContainer = styled(View)`
    width: 100%;
    margin-top: 20px;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const NoOpenLobbiesText = styled(Text)`
    text-align: center;
    width: 80%;
    font-family: "LoL Body";
    font-size: 16px;
    color: #aaaea0;
    margin-top: 30px;
`;

const Poro = styled(Image)`
    width: 160px;
    height: 160px;
`;

const GoldBorderedElement = styled(TouchableOpacity)`
    margin: 10px 10px 0 10px;
    border: 1px solid #644d1c;
    flex: 1;
    align-items: center;
    flex-direction: row;
    padding: 10px;
    background: #111216;
`;

const NameAndStatus = styled(View)`
    flex: 1;
    flex-direction: column;
    margin: 4px 0 4px 10px;
`;

const Name = styled(Text)`
    font-family: "LoL Body";
    font-size: 18px;
    color: #b9b5ab;
`;

const Status = styled(Text)`
    font-family: "LoL Body";
    font-size: 16px;
    color: #09a646;
`;

const Avatar = styled(ABImage)`
    width: 44px;
    height: 44px;
    border-radius: 22px;
    border: 1px #ae8939;
`;

const JoinButton = styled(Image)`
    width: 35px;
    height: 35px;
`;
