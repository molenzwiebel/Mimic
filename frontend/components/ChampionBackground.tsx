import { View } from "react-native";
import React, { useState } from "react";
import styled from "styled-components/native";
import ABImage from "./assets/ABImage";

const IMAGE_WIDTH = 1280;
const IMAGE_HEIGHT = 720;

interface ChampionBackgroundProps {
    championId: number;
    skinId: number;
    style?: any;
}

export default function ChampionBackground(props: ChampionBackgroundProps) {
    const [width, setWidth] = useState(0);
    const height = IMAGE_HEIGHT * (width / IMAGE_WIDTH);

    const uri = `v1/champion-splashes/${props.championId}/${props.skinId || props.championId * 1000}.jpg`;

    return (
        <Container style={props.style} onLayout={ev => setWidth(ev.nativeEvent.layout.width)}>
            {props.championId && <BackgroundImage path={uri} style={{ width, height, top: -30 }} />}
        </Container>
    );
}

const BackgroundImage = styled(ABImage)`
    position: absolute;
    left: 0;
    right: 0;
`;

const Container = styled(View)`
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
`;
