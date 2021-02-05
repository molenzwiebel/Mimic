import { default as React, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useObserver } from "mobx-react-lite";
import { Animated, Easing, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import styled from "styled-components/native";
import { bottomMargin } from "../../utils/notch";
import store, { GameQueue } from "../../stores/lobby-creation-store";
import { getGamemodeName } from "../../utils/constants";
import LCUButton from "../LCUButton";
import RootSubview from "./RootSubview";

const MAP_ICONS: any = {
    "11-CLASSIC-true": require("../../assets/icons/sr-active.png"),
    "11-CLASSIC-false": require("../../assets/icons/sr-default.png"),
    "12-ARAM-true": require("../../assets/icons/ha-active.png"),
    "12-ARAM-false": require("../../assets/icons/ha-default.png"),
    "22-TFT-true": require("../../assets/icons/tft-active.png"),
    "22-TFT-false": require("../../assets/icons/tft-default.png")
};

function getMapIcon(key: string, isActive: boolean) {
    return (
        MAP_ICONS[key + "-" + isActive] ||
        (isActive ? require("../../assets/icons/rgm-active.png") : require("../../assets/icons/rgm-default.png"))
    );
}

function QueueDiamond({ selected }: { selected: boolean }) {
    // Scale of the selected queue diamond.
    const innerScale = useRef(new Animated.Value(selected ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(innerScale, {
            toValue: selected ? 1 : 0,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: false
        }).start();
    }, [selected]);

    return (
        <QueueDiamondOuter>
            <QueueDiamondInner style={{ transform: [{ scale: innerScale }] }} />
        </QueueDiamondOuter>
    );
}

function Queue({ queue, selected }: { queue: GameQueue; selected: boolean }) {
    return (
        <TouchableOpacity onPress={() => store.selectQueue(queue)}>
            <QueueContainer>
                <QueueDiamond selected={selected} />
                <QueueName selected={selected}>{queue.description.toUpperCase()}</QueueName>
            </QueueContainer>
        </TouchableOpacity>
    );
}

function Queues() {
    return useObserver(() => {
        const queues = store.availableQueues[store.selectedSection] || [];

        return (
            <QueuesContainer>
                {queues.map(x => (
                    <Queue queue={x} selected={store.selectedQueueId === x.id} key={x.id} />
                ))}
            </QueuesContainer>
        );
    });
}

function Section({ id, selected }: { id: string; selected: boolean }) {
    // Opacity of the selected image.
    const selectedOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(selectedOpacity, {
            toValue: selected ? 1 : 0,
            duration: 200,
            easing: Easing.ease,
            useNativeDriver: true
        }).start();
    }, [selected]);

    return useObserver(() => (
        <SectionContainer>
            <TouchableWithoutFeedback onPressIn={() => store.selectSection(id)}>
                <SectionIconContainer>
                    <SectionIcon source={getMapIcon(id, false)} />
                    <SectionIcon source={getMapIcon(id, true)} style={{ opacity: selectedOpacity }} />
                </SectionIconContainer>
            </TouchableWithoutFeedback>
        </SectionContainer>
    ));
}

function Sections() {
    return useObserver(() => (
        <SectionsContainer>
            {store.sections.map(x => (
                <Section id={x} key={x} selected={store.selectedSection === x} />
            ))}
        </SectionsContainer>
    ));
}

function SelectedSectionName() {
    // This can't be a text directly since the bottom border doesn't render on iOS.
    return useObserver(() => (
        <SectionNameContainer>
            <SectionNameText>{getGamemodeName(store.selectedSection).toUpperCase()}</SectionNameText>
        </SectionNameContainer>
    ));
}

function CreateLobby({ onClose }: { onClose: Function }) {
    return (
        <RootSubview title="Create Lobby" onClose={onClose}>
            <View style={{ flex: 1 }}>
                <Sections />
                <SelectedSectionName />
                <Queues />
                <LCUButton
                    style={{ paddingLeft: 5, paddingRight: 5, marginBottom: bottomMargin + 5 }}
                    onClick={() => store.createLobby()}>
                    Confirm
                </LCUButton>
            </View>
        </RootSubview>
    );
}

export default observer(CreateLobby);

const SectionsContainer = styled(View)`
    padding: 20px 5px 0 5px;
    flex-direction: row;
    align-items: center;
`;

const SectionContainer: any = styled(View)`
    flex: 1;
    align-items: center;
    justify-content: center;
`;

const SectionIconContainer = styled(View)`
    width: 80px;
    height: 80px;
`;

const SectionIcon = styled(Animated.Image)`
    position: absolute;
    top: 0;
    left: 0;
    width: 80px;
    height: 80px;
`;

const SectionNameContainer = styled(View)`
    width: 100%;
    border: 0px solid rgba(255, 255, 255, 0.7);
    border-bottom-width: 1px;
`;

const SectionNameText = styled(Text)`
    margin-top: 5px;
    padding: 10px;
    width: 100%;
    text-align: center;
    font-family: "LoL Display Bold";
    font-size: 22px;
    color: #f0d9a3;
`;

const QueuesContainer = styled(View)`
    margin-top: 12px;
    width: 100%;
    flex: 1;
`;

const QueueContainer = styled(View)`
    flex-direction: row;
    margin: 5px;
    align-items: center;
`;

const QueueName: any = styled(Text)`
    font-family: "LoL Display Bold";
    font-size: 18px;
    margin-left: 10px;
    color: ${(props: any) => (props.selected ? "#e2d5ab" : "#b0a27c")};
`;

const QueueDiamondOuter = styled(View)`
    margin: 5px;
    margin-left: 15px;
    width: 20px;
    height: 20px;
    border: 3px solid #87692c;
    transform: rotate(45deg);
`;

const QueueDiamondInner = styled(Animated.View)`
    width: 8px;
    height: 8px;
    margin: 3px;
    background-color: #f0e6d2;
`;
