import { TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import styled from "styled-components/native";

interface CircularLCUButtonProps {
    style?: any;
    size: number;
    onClick: () => any;
    children: any;
}

export default function CircularLCUButton({ style, size, children, onClick }: CircularLCUButtonProps) {
    return (
        <TouchableOpacity style={[style, { height: size, width: size }]} onPress={onClick}>
            <Border size={size} colors={["#c8aa6eff", "#c8a355ff", "#c89c3cff", "#785b28ff"]} locations={[0, 0.29, 0.45, 1]}>
                <Content size={size}>
                    {children}
                </Content>
            </Border>
        </TouchableOpacity>
    );
}

const Border = styled<any>(LinearGradient)`
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    border-radius: ${props => props.size / 2};
`;

const Content = styled<any>(View)`
    border-radius: ${props => props.size / 2};
    align-self: stretch;
    flex: 1;
    margin: 2px;
    background-color: #1E2328;
    align-items: center;
    justify-content: center;
`;