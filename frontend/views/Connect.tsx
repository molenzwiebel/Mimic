import React, { createRef, useLayoutEffect, useRef, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import Intro from "../components/connect/Intro";
import { markIntroShown } from "../utils/persistence";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import LCUButton from "../components/LCUButton";
import { StackNavigationOptions } from "@react-navigation/stack/lib/typescript/src/types";
import styled from "styled-components/native";
import BottomSheet from "reanimated-bottom-sheet";
import Animated from "react-native-reanimated";
import { NavigationContainerRef } from "@react-navigation/core";
import HelpSheet, { HELP_SHEET_HEIGHT } from "../components/connect/HelpSheet";
import PreviousDevices from "../components/connect/PreviousDevices";

export const connectNavigationRef = createRef<NavigationContainerRef>();

const ModalStack = createStackNavigator();
const ConnectStack = createStackNavigator();

export enum ConnectRoutes {
    MODAL_INTRO = "Intro",
    MODAL_CONTENT = "Content",
    MIMIC_HOME = "Home",
    ADD_NEW_DEVICE = "Add New Device"
}

function HomeHelpButton({ onPress }: { onPress: () => void }) {
    return (
        <HelpButtonContainer onPress={onPress}>
            <AntDesign name="questioncircleo" size={22} color="#f0e6d3" />
        </HelpButtonContainer>
    );
}

const HelpButtonContainer = styled(TouchableOpacity)`
    margin-left: 15px;
`;

function HomeContent() {
    const navigation = useNavigation();
    const sheetRef = useRef<BottomSheet | null>(null);
    const [darken] = useState(new Animated.Value(1));

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
        <>
            <Animated.View style={{ flex: 1, opacity: Animated.add(0.1, Animated.multiply(darken, 0.9)) }}>
                <PreviousDevices
                    onRegisterNew={() => {
                        navigation.navigate(ConnectRoutes.ADD_NEW_DEVICE);
                    }}
                />
            </Animated.View>

            <BottomSheet
                ref={sheetRef}
                initialSnap={0}
                snapPoints={[HELP_SHEET_HEIGHT, 0]}
                callbackNode={darken}
                renderContent={HelpSheet}
            />
        </>
    );
}

function AddDeviceContent() {
    const navigation = useNavigation();

    return (
        <View>
            <Text>Add device</Text>
        </View>
    );
}

const LCU_NAVBAR_STYLE: StackNavigationOptions = {
    headerStyle: {
        backgroundColor: "#1D222B",
        borderBottomWidth: 2,
        borderBottomColor: "#644d1c",
        shadowColor: "transparent"
    },
    headerTintColor: "#f0e6d3",
    headerTitleStyle: {
        color: "#f0e6d3"
    },
    cardStyle: {
        backgroundColor: "#111216"
    },
    headerBackTitleVisible: false
};

function RootContent() {
    return (
        <ConnectStack.Navigator screenOptions={LCU_NAVBAR_STYLE}>
            <ConnectStack.Screen name={ConnectRoutes.MIMIC_HOME} component={HomeContent} />
            <ConnectStack.Screen name={ConnectRoutes.ADD_NEW_DEVICE} component={AddDeviceContent} />
        </ConnectStack.Navigator>
    );
}

function IntroModal() {
    const navigation = useNavigation();

    return (
        <Intro
            onDone={() => {
                markIntroShown();
                navigation.goBack();
            }}
        />
    );
}

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
