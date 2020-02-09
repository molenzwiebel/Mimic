import React, { useEffect, useRef } from "react";
import { onGestureEvent } from "react-native-redash";
import Animated, { Easing } from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Dimensions, View } from "react-native";
import styled from "styled-components/native";
import Constants from "expo-constants";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface FullscreenOverlayProps {
    marginTop: number;
    visible: boolean;
    render: () => any;
    onClose: () => any;
}

const { Value, call, Extrapolate, useCode, cond, greaterOrEq, eq, set } = Animated;

export default function FullscreenOverlay({ marginTop, visible, render, onClose }: FullscreenOverlayProps) {
    const translationY = useRef(new Value<number>(SCREEN_HEIGHT)).current;
    const velocityY = useRef(new Value<number>(0)).current;
    const state = useRef(new Value(State.UNDETERMINED)).current;

    const goDown = () => {
        Animated.spring(translationY, {
            toValue: SCREEN_HEIGHT,
            damping: 15,
            mass: 1,
            stiffness: 150,
            overshootClamping: false,
            restSpeedThreshold: 0.1,
            restDisplacementThreshold: 0.1
        }).start(() => {
            onClose();
        });
    };

    const goUp = () => {
        Animated.spring(translationY, {
            toValue: 0,
            damping: 15,
            mass: 1,
            stiffness: 150,
            overshootClamping: false,
            restSpeedThreshold: 0.1,
            restDisplacementThreshold: 0.1
        }).start();
    };

    useEffect(() => {
        Animated.timing(translationY, {
            toValue: visible ? 0 : SCREEN_HEIGHT,
            duration: 300,
            easing: Easing.ease
        }).start();
    }, [visible]);

    const gestureHandler = onGestureEvent({
        state,
        translationY,
        velocityY
    });

    // Make sure we cannot drag up above the limit.
    const translateY = translationY.interpolate({
        inputRange: [0, SCREEN_HEIGHT],
        outputRange: [0, SCREEN_HEIGHT],
        extrapolateLeft: Extrapolate.CLAMP
    });

    useCode(
        // If we stopped dragging...
        () =>
            cond(eq(state, State.END), [
                // Either go back up or completely down depending on how far we dragged.
                cond(greaterOrEq(translationY, SCREEN_HEIGHT * 0.1), [call([], goDown)], [call([], goUp)]),

                // And set the state to undetermined to not trigger this again the next frame
                set(state, State.UNDETERMINED)
            ]),
        [state]
    );

    return (
        <PanGestureHandler {...gestureHandler}>
            <Container style={{ transform: [{ translateY }] }}>
                <View
                    style={{
                        flex: 1,
                        alignSelf: "stretch",
                        marginTop: Constants.statusBarHeight + marginTop
                    }}>
                    {render()}
                </View>
            </Container>
        </PanGestureHandler>
    );
}

const Container = styled(Animated.View)`
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: ${SCREEN_HEIGHT};
`;
