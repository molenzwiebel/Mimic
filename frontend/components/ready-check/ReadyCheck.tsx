import { LinearGradient } from "expo-linear-gradient";
import { autorun } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import styled from "styled-components/native";

import readyCheck from "../../stores/ready-check-store";
import LCUButton from "../LCUButton";
import AnimatedFlameBackground from "../AnimatedFlameBackground";

const PROGRESS_BAR_HEIGHT = 35;

const ReadyCheckProgressBar = observer(() => {
    const widthAnimation = useRef(new Animated.Value(100)).current;
    const [previousWidthAnimation, setPreviousWidthAnimation] = useState<Animated.CompositeAnimation | null>(null);

    // Animation for the bar slowly going down.
    useEffect(() => {
        // Run the following function every time the target goes down.
        return autorun(() => {
            // If we had a previous animation, cancel it.
            if (previousWidthAnimation) {
                previousWidthAnimation.stop();
            }

            // Create an animation to the new target
            const newWidth = readyCheck.progressAnimationTarget;
            const newAnim = Animated.timing(widthAnimation, {
                toValue: newWidth,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: false
            });

            // And start it.
            newAnim.start();
            setPreviousWidthAnimation(newAnim);
        });
    }, []);

    const colors = {
        Accepted: ["#349954ff", "#a1e08fff", "#31bd2dff", "#47a96eff"],
        Declined: ["#c6403bff", "#f9413fff", "#ec3930ff", "#ee241dff"]
    }[readyCheck.state!.playerResponse] || ["#197e99ff", "#134b6dff", "#197e99ff", "#1e465dff"];

    const width = widthAnimation.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"]
    });

    // Note: cannot use native driver
    return (
        <ProgressBarContainer>
            <AnimatedFlameBackground
                size={PROGRESS_BAR_HEIGHT}
                style={{ width }}
                colors={colors}
                useNativeDriver={false}
            />
        </ProgressBarContainer>
    );
});

const ReadyCheckButtons = observer(() => {
    return (
        <>
            <AcceptButton disabled={readyCheck.hasResponded} onClick={() => readyCheck.accept()} type="confirm">
                Accept!
            </AcceptButton>
            <DeclineButton disabled={readyCheck.hasResponded} onClick={() => readyCheck.decline()}>
                Decline
            </DeclineButton>
        </>
    );
});

export default function ReadyCheck() {
    return (
        <ContainerBorder colors={["#463714ff", "#463714ff", "#614a1fff"]} locations={[0, 0.05, 1]}>
            <Container>
                <ReadyCheckProgressBar />

                <Title>MATCH FOUND</Title>

                <ReadyCheckButtons />
            </Container>
        </ContainerBorder>
    );
}

const ContainerBorder = styled(LinearGradient)`
    height: 230px;
    width: 85%;
    align-items: center;
    justify-content: center;
`;

const Container = styled(View)`
    flex: 1;
    align-self: stretch;
    margin: 4px;
    background-color: #010a13;
    flex-direction: column;
    align-items: center;
`;

const Title = styled(Text)`
    color: #f0e6d2;
    font-family: "LoL Body";
    margin: 20px;
    font-size: 35px;
    letter-spacing: 1px;
    font-weight: bold;
`;

const AcceptButton = styled(LCUButton)`
    width: 80%;
`;

const DeclineButton = styled(LCUButton)`
    width: 60%;
    margin-top: 20px;
    height: 35px;
`;

const ProgressBarContainer = styled(View)`
    width: 100%;
    height: ${PROGRESS_BAR_HEIGHT}px;
    border: 0 solid #463714;
    border-bottom-width: 4px;
    flex-direction: column;
    overflow: hidden;
`;
