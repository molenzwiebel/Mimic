import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import styled from "styled-components/native";
import React, { useState } from "react";
import ChampionBackground from "../ChampionBackground";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { ClassicManifest } from "expo-updates";
import { connectNavigationRef, ConnectRoutes } from "../../views/Connect";

export const HELP_SHEET_HEIGHT = 450;

function Version() {
    const [status, setStatus] = useState("Check for updates");

    const checkForUpdate = async () => {
        setStatus("Checking...");
        const status = await Updates.checkForUpdateAsync();
        if (!status.isAvailable) {
            setStatus("No New Updates");
            return;
        }
        setStatus("Downloading v" + (status.manifest as ClassicManifest)!.version);
        await Updates.fetchUpdateAsync();
        setStatus("Relaunching");
        await Updates.reloadAsync();
    };

    const build =
        (Constants.manifest as ClassicManifest)!.extra?.build ??
        (Constants.manifest as ClassicManifest)!.ios?.buildNumber ??
        (Constants.manifest as ClassicManifest)!.android?.versionCode ??
        "???";

    return (
        <TouchableWithoutFeedback onPress={checkForUpdate}>
            <VersionDescription>
                Version v{(Constants.manifest as ClassicManifest)!.version} - build {build}
                {"\n"}
                <Underlined>{status}</Underlined>
            </VersionDescription>
        </TouchableWithoutFeedback>
    );
}

// material/antdesign settings icon
const MSI = ({ icon }: { icon: string }) => <MaterialCommunityIcons name={icon as any} size={22} color="#f0e6d3" />;
const ASI = ({ icon }: { icon: string }) => <AntDesign name={icon as any} size={22} color="#f0e6d3" />;

function SettingItem({ icon, text, onPress }: { icon: any; text: string; onPress: () => void }) {
    return (
        <SettingContainer onPress={onPress}>
            <SettingIconContainer>{icon}</SettingIconContainer>

            <SettingTextContainer>
                <SettingText>{text}</SettingText>
            </SettingTextContainer>
        </SettingContainer>
    );
}

export default function HelpSheet() {
    return (
        <Container>
            <TitleImageContainer>
                <ImageContainer championId={7} skinId={7029} />
                <Title>Mimic</Title>
            </TitleImageContainer>

            <Divider />

            <Version />

            <Divider />

            <SettingItem
                icon={<ASI icon="book" />}
                text="Show Introduction"
                onPress={() => {
                    connectNavigationRef.current!!.navigate(ConnectRoutes.MODAL_INTRO);
                }}
            />
            <SettingItem
                icon={<ASI icon="questioncircleo" />}
                text="F.A.Q. & Support"
                onPress={() => {
                    Linking.openURL("https://mimic.lol/faq");
                }}
            />
            <SettingItem
                icon={<MSI icon="discord" />}
                text="Discord Server"
                onPress={() => {
                    Linking.openURL("https://discord.gg/bfxdsRC");
                }}
            />
            <SettingItem
                icon={<ASI icon="github" />}
                text="Source Code"
                onPress={() => {
                    Linking.openURL("https://github.com/molenzwiebel/mimic");
                }}
            />
        </Container>
    );
}

const TitleImageContainer = styled(View)`
    position: relative;
    width: 100%;
    height: 100px;
`;

const Title = styled(Text)`
    font-family: LoL Display Bold;
    font-size: 28px;
    color: #f0e6d3;
    font-weight: bold;
    position: absolute;
    left: 16px;
    bottom: 16px;
`;

const ImageContainer = styled(ChampionBackground)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const Container = styled(View)`
    height: ${HELP_SHEET_HEIGHT}px;
    border: 0 solid #644d1c;
    border-top-width: 3px;
    background-color: #111216;
`;

const Divider = styled(View)`
    width: 100%;
    height: 1px;
    background-color: #aaaea0;
    opacity: 0.2;
`;

const VersionDescription = styled(Text)`
    font-family: "LoL Body";
    font-size: 14px;
    color: #aaaea0;
    margin: 10px 10px;
`;

const Underlined = styled(Text)`
    text-decoration: underline #aaaea0;
`;

const SettingContainer = styled(TouchableOpacity)`
    margin: 15px;
    width: 100%;
    flex-direction: row;
`;

const SettingIconContainer = styled(View)`
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-right: 15px;
`;

const SettingTextContainer = styled(View)`
    flex: 1;
    flex-direction: column;
    justify-content: center;
`;

const SettingText = styled(Text)`
    font-family: LoL Body;
    font-size: 17px;
    color: #aaaea0;
`;
