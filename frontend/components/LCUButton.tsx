import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import styled from "styled-components/native";

interface LCUButtonProps {
    disabled?: boolean;
    type?: "normal" | "confirm" | "deny";
    children: string;
    onClick: () => void;
    style?: any;
}

export default function LCUButton({ style, disabled = false, type = "normal", children, onClick }: LCUButtonProps) {
    const colors = {
        normal: ["#c8aa6eff", "#c8a355ff", "#c89c3cff", "#785b28ff"],
        confirm: ["#0ac8b9ff", "#0596aaff", "#0596aaff", "#0d404cff"],
        deny: ["#ee241dff", "#ec3930ff", "#f9413fff", "#c6403bff"]
    };

    const locations = {
        normal: [0, 0.29, 0.45, 1],
        confirm: [0, 0.07, 0.56, 1],
        deny: [0, 0.07, 0.56, 1]
    };

    return (
        <TouchableOpacity style={[style, { height: 55 }]} disabled={disabled} onPress={onClick}>
            <Border
                colors={disabled ? ["#5c5b57ff", "#5c5b57ff"] : colors[type]}
                locations={disabled ? [0, 1] : locations[type]}>
                <Content>
                    <ButtonText disabled={disabled} type={type}>
                        {children.toUpperCase()}
                    </ButtonText>
                </Content>
            </Border>
        </TouchableOpacity>
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
            : ({
                  normal: "#cdbe91",
                  confirm: "#a3c7c7",
                  deny: "#bd253c"
              } as any)[props.type]};
`;
