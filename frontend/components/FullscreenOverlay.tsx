import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, View } from "react-native";
import styled from "styled-components/native";
import Constants from "expo-constants";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface FullscreenOverlayProps {
    marginTop: number;
    visible: boolean;
    render: () => any;
}

export default function FullscreenOverlay({ marginTop, visible, render }: FullscreenOverlayProps) {
    const translation = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [onScreen, setOnScreen] = useState(visible);

    if (visible && !onScreen) {
        setOnScreen(true);
    }

    useEffect(() => {
        Animated.timing(translation, {
            toValue: visible ? 0 : SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.ease
        }).start(() => {
            setOnScreen(visible);
        });
    }, [visible]);

    return <Container style={{ transform: [{ translateY: translation }] }}>
        <View style={{ flex: 1, alignSelf: "stretch", marginTop: Constants.statusBarHeight + marginTop }}>
            {onScreen && render()}
        </View>
    </Container>;
}

const Container = styled(Animated.View)`
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: ${SCREEN_HEIGHT};
`;