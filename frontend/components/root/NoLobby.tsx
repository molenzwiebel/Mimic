import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import React, { useEffect, useState } from "react";
import creationStore, { RecentQueue } from "../../stores/lobby-creation-store";
import OnlineFriends from "./JoinOpenLobby";
import CircularLCUButton from "../CircularLCUButton";
import { Ionicons } from "@expo/vector-icons";

export default function NoLobby({ onCreate }: { onCreate: Function }) {
    return (
        <Background source={require("../../assets/backgrounds/magic-background.jpg")}>
            <ScrollView>
                <LobbySectionHeader>CREATE A LOBBY</LobbySectionHeader>
                <Queues onCreate={onCreate} />

                <LobbySectionHeader>JOIN A FRIEND</LobbySectionHeader>
                <OnlineFriends />
            </ScrollView>
        </Background>
    );
}

function CreateLobbyOption({ onCreate }: { onCreate: Function }) {
    return (
        <GoldBorderedElement onPress={() => onCreate()}>
            <View style={{ height: 40, width: 80, position: "relative", marginRight: 10 }}>
                <MapIcon source={getMapIcon(11)} style={{ position: "absolute", left: 0 }} />
                <MapIcon source={getMapIcon(12)} style={{ position: "absolute", left: 20 }} />
                <MapIcon source={getMapIcon(13)} style={{ position: "absolute", left: 40 }} />
            </View>

            <TitleAndSubtitle>
                <Title>Select Queue & Gamemode</Title>
            </TitleAndSubtitle>

            <CircularLCUButton size={30} onClick={() => onCreate()}>
                <Ionicons name="ios-arrow-forward" size={18} color="#cebf93" />
            </CircularLCUButton>
        </GoldBorderedElement>
    );
}

function RecentQueueOption({ queue }: { queue: RecentQueue }) {
    const description =
        queue.mapDescription === queue.queueDescription
            ? queue.mapDescription
            : `${queue.mapDescription} - ${queue.queueDescription}`;

    const onClick = () => creationStore.createLobby(queue.queueId);

    return (
        <>
            <GoldBorderedElement onPress={() => onClick()}>
                <MapIcon source={getMapIcon(queue.mapId)} />
                <TitleAndSubtitle>
                    <Title>Recently Played</Title>
                    <Subtitle>{description}</Subtitle>
                </TitleAndSubtitle>
                <CircularLCUButton size={30} onClick={() => onClick()}>
                    <Ionicons name="md-checkmark" size={18} color="#cebf93" />
                </CircularLCUButton>
            </GoldBorderedElement>

            <CenteredOrText>OR</CenteredOrText>
        </>
    );
}

function Queues({ onCreate }: { onCreate: Function }) {
    const [recentQueue, setRecentQueue] = useState<RecentQueue | null>(null);

    useEffect(() => {
        let isMounted = true;

        creationStore.getRecentQueue().then(x => {
            if (!isMounted) return;
            setRecentQueue(x);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <>
            {recentQueue && <RecentQueueOption queue={recentQueue} />}
            <CreateLobbyOption onCreate={onCreate} />
        </>
    );
}

const MAP_ICONS: any = {
    [11]: require("../../assets/icons/sr-active.png"),
    [12]: require("../../assets/icons/ha-active.png"),
    [22]: require("../../assets/icons/tft-active.png")
};

function getMapIcon(id: number) {
    return MAP_ICONS[id] || require("../../assets/icons/rgm-active.png");
}

const Background = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    background-color: #111216;
`;

const LobbySectionHeader = styled(Text)`
    margin-top: 20px;
    margin-left: 10px;
    font-family: LoL Body;
    font-weight: 300;
    letter-spacing: 0.3px;
    font-size: 14px;
    color: #aaaea0;
`;

const CenteredOrText = styled(LobbySectionHeader as any)`
    width: 100%;
    text-align: center;
    margin-top: 10px;
    opacity: 0.6;
`;

const GoldBorderedElement = styled(TouchableOpacity)`
    margin: 10px 10px 0 10px;
    border: 1px solid #644d1c;
    background: #111216;
    flex: 1;
    align-items: center;
    flex-direction: row;
    padding: 10px;
`;

const MapIcon = styled(Image)`
    width: 40px;
    height: 40px;
    margin-right: 10px;
`;

const TitleAndSubtitle = styled(View)`
    flex: 1;
    flex-direction: column;
    margin: 4px 0 4px 0;
`;

const Title = styled(Text)`
    font-family: "LoL Body";
    font-size: 18px;
    color: #b9b5ab;
`;

const Subtitle = styled(Text)`
    font-family: "LoL Body";
    font-size: 16px;
    color: #09a646;
`;
