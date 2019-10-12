import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import queue from "../../stores/queue-store";
import notchHeight from "../../utils/notch";
import AnimatedFlameBackground from "../AnimatedFlameBackground";

const HEIGHT = 80 + notchHeight;
const formatSeconds = (secs: number) =>
    Math.floor(secs / 60) + ":" + ("00" + (Math.round(secs) % 60).toFixed(0)).slice(-2);

// Separate component to avoid rerendering QueueStatusContent every second.
const QueueTime = observer(() => {
    return <ElapsedTime>{formatSeconds(queue.state!.timeInQueue)}</ElapsedTime>;
});

const QueueStatusContent = observer(() => {
    return (
        <QueueStatusContainer>
            <AnimatedFlameBackground size={HEIGHT} />

            <LeftItems>
                <Ionicons name="md-search" size={50} color="white" />

                <Time>
                    <QueueTime />
                    <EstimatedTime>Estimated: {formatSeconds(queue.state!.estimatedQueueTime)}</EstimatedTime>
                </Time>
            </LeftItems>

            <TouchableOpacity onPress={() => queue.leaveQueue()}>
                <Ionicons style={{ zIndex: 1 }} name="md-log-out" size={35} color="white" />
            </TouchableOpacity>
        </QueueStatusContainer>
    );
});

function QueueStatus() {
    const isInQueue = queue.state && queue.state.isCurrentlyInQueue;
    const height = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(height, {
            toValue: isInQueue ? HEIGHT : 0,
            duration: 300,
            easing: Easing.ease
        }).start();
    }, [isInQueue]);

    return <QueuePositioner style={{ height }}>{isInQueue && <QueueStatusContent />}</QueuePositioner>;
}

export default observer(QueueStatus as any);

const QueuePositioner = styled(Animated.View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: hidden;
`;

const QueueStatusContainer = styled(View)`
    height: ${HEIGHT}px;
    overflow: hidden;
    border: 3px solid #785a28;
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
    flex-direction: row;
    padding: 10px 20px;
    padding-top: ${notchHeight + 10}px;
    align-items: center;
    justify-content: space-between;
`;

const LeftItems = styled(View)`
    flex-direction: row;
    align-items: center;
`;

const Time = styled(View)`
    margin-left: 20px;
    flex-direction: column;
`;

const ElapsedTime = styled(Text)`
    font-size: 30px;
    color: #f0e6d2;
    letter-spacing: 1px;
    font-family: "LoL Display Bold";
`;

const EstimatedTime = styled(Text)`
    font-size: 20px;
    color: #0acbe6;
    font-family: "LoL Display";
`;
