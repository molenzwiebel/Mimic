import React, { createRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import Intro from "../components/connect/Intro";
import * as persistence from "../utils/persistence";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { TouchableOpacity, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import styled from "styled-components/native";
import BottomSheet from "reanimated-bottom-sheet";
import Animated from "react-native-reanimated";
import { NavigationContainerRef } from "@react-navigation/core";
import HelpSheet, { HELP_SHEET_HEIGHT } from "../components/connect/HelpSheet";
import PreviousDevices from "../components/connect/PreviousDevices";
import CodeEntry from "../components/connect/CodeEntry";
import { LCU_NAVBAR_STYLE } from "../utils/constants";
import { BottomSheetBackground } from "../components/BottomSheetBackground";

export const connectNavigationRef = createRef<NavigationContainerRef>();

const ModalStack = createStackNavigator();
const ConnectStack = createStackNavigator();

export enum ConnectRoutes {
    MODAL_INTRO = "Intro",
    MODAL_CONTENT = "Content",
    MIMIC_HOME = "Connect",
    ADD_NEW_DEVICE = "Add New Device"
}

// Simple help button
function HomeHelpButton({ onPress }: { onPress: () => void }) {
    return (
        <HelpButtonContainer onPress={onPress}>
            <AntDesign name="questioncircleo" size={22} color="#f0e6d3" />
        </HelpButtonContainer>
    );
}

// Content for the home screen.
function HomeContent() {
    const navigation = useNavigation();
    const sheetRef = useRef<BottomSheet | null>(null);
    const [darken] = useState(new Animated.Value(1));

    useEffect(() => {
        persistence.getMimicSettings().then(settings => {
            if (settings.hasShownIntroduction) return;

            navigation.navigate(ConnectRoutes.MODAL_INTRO);
        });
    });

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HomeHelpButton
                    onPress={() => {
                        sheetRef.current!.snapTo(0);
                    }}
                />
            )
        });
    }, [navigation]);

    return (
        <View style={{ flex: 1 }}>
            <BottomSheetBackground sheetRef={sheetRef} darken={darken} />

            <Animated.View style={{ flex: 1 }}>
                <PreviousDevices
                    onRegisterNew={() => {
                        navigation.navigate(ConnectRoutes.ADD_NEW_DEVICE);
                    }}
                />
            </Animated.View>

            <BottomSheet
                ref={sheetRef}
                initialSnap={1}
                snapPoints={[HELP_SHEET_HEIGHT, 0]}
                callbackNode={darken}
                renderContent={HelpSheet}
            />
        </View>
    );
}

// Content for the Add new device screen.
function AddDeviceContent() {
    const navigation = useNavigation();

    return (
        <CodeEntry
            onDone={() => {
                navigation.goBack();
            }}
        />
    );
}

// Content of the main modal (horizontal pushes)
function RootContent() {
    return (
        <ConnectStack.Navigator screenOptions={LCU_NAVBAR_STYLE}>
            <ConnectStack.Screen name={ConnectRoutes.MIMIC_HOME} component={HomeContent} />
            <ConnectStack.Screen name={ConnectRoutes.ADD_NEW_DEVICE} component={AddDeviceContent} />
        </ConnectStack.Navigator>
    );
}

// Modal that just shows the intro.
function IntroModal() {
    const navigation = useNavigation();

    return (
        <Intro
            onDone={async () => {
                await persistence.withMimicSettings(s => {
                    s.hasShownIntroduction = true;
                });
                navigation.goBack();
            }}
        />
    );
}

// Main connect screen that contains a navigator for modals.
export default function Connect() {
    return (
        <NavigationContainer ref={connectNavigationRef}>
            <ModalStack.Navigator mode="modal">
                <ModalStack.Screen
                    name={ConnectRoutes.MODAL_CONTENT}
                    options={{ headerShown: false }}
                    component={RootContent}
                />

                <ModalStack.Screen
                    name={ConnectRoutes.MODAL_INTRO}
                    options={{ headerShown: false }}
                    component={IntroModal}
                />
            </ModalStack.Navigator>
        </NavigationContainer>
    );
}

const HelpButtonContainer = styled(TouchableOpacity)`
    margin-left: 15px;
`;
