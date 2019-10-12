import { default as React, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import styled from "styled-components/native";
import { LinearGradient } from "expo-linear-gradient";

export default function AnimatedFlameBackground({
    size,
    duration = 5000,
    colors = ["#197e99ff", "#134b6dff", "#197e99ff", "#1e465dff"],
    style,
    useNativeDriver = true
}: {
    size: number;
    duration?: number;
    colors?: string[];
    style?: any;
    useNativeDriver?: boolean;
}) {
    const translation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const ref = Animated.loop(
            Animated.sequence([
                Animated.timing(translation, {
                    toValue: -size * 3,
                    duration,
                    useNativeDriver,
                    easing: Easing.ease
                }),

                Animated.timing(translation, {
                    toValue: 0,
                    duration,
                    useNativeDriver,
                    easing: Easing.ease
                })
            ])
        );

        ref.start();
        return () => ref.stop();
    }, []);

    return (
        <Background
            colors={colors}
            start={[0, 0]}
            end={[-0.104528463267653, 0.994521895368273]}
            style={[{ height: size * 4, transform: [{ translateY: translation }] }, style]}
        />
    );
}

const Background = styled(Animated.createAnimatedComponent(LinearGradient))`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
`;
