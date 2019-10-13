import React from "react";
import { Image, Text, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import styled from "styled-components/native";
import notchHeight, { bottomMargin } from "../../utils/notch";

const slides = [
    {
        key: "welcome",
        title: "Welcome to Mimic!",
        text:
            "Mimic is a remote client for League of Legends. Create a lobby, invite your friends, accept your queue and pick a champion. All from your phone.",
        image: require("../../assets/intro/ic_intro_1.png")
    },
    {
        key: "getting-started",
        title: "Getting Started",
        text:
            "Mimic requires a desktop application to communicate with League of Legends. Download it by browsing to mimic.lol on your computer.",
        image: require("../../assets/intro/ic_intro_2.png")
    },
    {
        key: "connecting",
        title: "Connecting to League",
        text:
            "You can control League at any time from anywhere as long as Mimic is running. Simply use the 6 digit code to connect.",
        image: require("../../assets/intro/ic_intro_3.png")
    }
];

export default function Intro({ onDone }: { onDone: () => any }) {
    const renderItem = ({ item, dimensions }: any) => (
        <View style={[slideStyles, dimensions]}>
            <Title>{item.title}</Title>
            <SlideImage source={item.image} />
            <Description>{item.text}</Description>
        </View>
    );

    return (
        <Container>
            <AppIntroSlider renderItem={renderItem} slides={slides} onDone={onDone} />
        </Container>
    );
}

const Container = styled(View)`
    padding-top: ${notchHeight}px;
    padding-bottom: ${bottomMargin}px;
    flex: 1;
    height: 100%;
    background-color: #9b59b6;
`;

const slideStyles = {
    flexDirection: "column",
    alignItems: "center",
    padding: 10
};

const Title = styled(Text)`
    margin-top: 30px;
    color: rgba(255, 255, 255, 0.8);
    background-color: transparent;
    text-align: center;
    padding: 0 16px;
    font-size: 30px;
`;

const SlideImage = styled(Image)`
    margin-top: 30px;
    width: 300px;
    height: 300px;
`;

const Description = styled(Text)`
    font-size: 17px;
    color: white;
    background-color: transparent;
    text-align: center;
    margin: 50px 30px 16px 30px;
`;
