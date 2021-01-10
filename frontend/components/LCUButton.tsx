import { Text, TouchableWithoutFeedback, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import styled from "styled-components/native";

interface LCUButtonProps {
    disabled?: boolean;
    type?: "normal" | "confirm" | "deny";
    children: string;
    onClick: () => void;
    style?: any;
}

export default function LCUButton({ style, disabled = false, type = "normal", children, onClick }: LCUButtonProps) {
    const [isPressed, setPressed] = useState(false);

    const colors = {
        normal: ["#c8aa6eff", "#c8a355ff", "#c89c3cff", "#785b28ff"],
        confirm: ["#0ac8b9ff", "#0596aaff", "#0596aaff", "#0d404cff"],
        deny: ["#ee241dff", "#ec3930ff", "#f9413fff", "#c6403bff"]
    };

    const activeColors = {
        normal: ["#806b46ff", "#806737ff", "#806326ff", "#332712ff"],
        confirm: ["#068075ff", "#036673ff", "#047180ff", "#092b33ff"],
        deny: ["#991814ff", "#992420ff", "#992828ff", "#802926ff"]
    };

    const locations = {
        normal: [0, 0.29, 0.45, 1],
        confirm: [0, 0.07, 0.56, 1],
        deny: [0, 0.07, 0.56, 1]
    };

    return (
        <View style={[style, { height: 55 }]}>
            <TouchableWithoutFeedback
                disabled={disabled}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                onPress={onClick}>
                <Border
                    colors={disabled ? ["#5c5b57ff", "#5c5b57ff"] : isPressed ? activeColors[type] : colors[type]}
                    locations={disabled ? [0, 1] : locations[type]}>
                    <Content>
                        <ButtonText disabled={disabled} type={type} active={isPressed}>
                            {children.toUpperCase()}
                        </ButtonText>
                    </Content>
                </Border>
            </TouchableWithoutFeedback>
        </View>
    );
}

const Border = styled(LinearGradient)`
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

const Content = styled(View)`
    align-self: stretch;
    flex: 1;
    margin: 3px;
    background-color: #1e2328;
    align-items: center;
    justify-content: center;
`;

const ButtonText = styled<any>(Text)`
    font-size: 23px;
    font-family: "LoL Display Bold";
    color: ${props =>
        props.disabled
            ? "#5c5b57"
            : (props.active
                  ? ({
                        normal: "#80765b",
                        confirm: "#698080",
                        deny: "#80192b"
                    } as any)
                  : ({
                        normal: "#cdbe91",
                        confirm: "#a3c7c7",
                        deny: "#bd253c"
                    } as any))[props.type]};
`;
