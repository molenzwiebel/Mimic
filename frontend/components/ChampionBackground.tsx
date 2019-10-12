import { View, Image } from "react-native";
import React, { useState } from "react";
import styled from "styled-components/native";

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

    let uri;
    if (props.skinId) {
        uri = `https://cdn.communitydragon.org/latest/champion/${props.championId}/splash-art/centered/skin/${props.skinId % 1000}`;
    } else {
        uri = `https://cdn.communitydragon.org/latest/champion/${props.championId}/splash-art/centered`;
    }

    return <Container style={props.style} onLayout={ev => setWidth(ev.nativeEvent.layout.width)}>
        <BackgroundImage
            source={{ uri }}
            style={{ width, height, top: -30 }}
        />
    </Container>
}

const BackgroundImage = styled(Image)`
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