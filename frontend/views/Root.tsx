import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import styled from "styled-components/native";
import BottomSheet from "reanimated-bottom-sheet";
import Animated from "react-native-reanimated";
import { LCU_NAVBAR_STYLE } from "../utils/constants";
import ConnectionStateSheet, { CONNECTION_STATE_SHEET_HEIGHT } from "../components/root/ConnectionStateSheet";
import NoLobby from "../components/root/NoLobby";
import JoinOpenLobby from "../components/root/JoinOpenLobby";
import CreateLobby from "../components/root/CreateLobby";
import Settings from "../components/root/Settings";
import NotificationPrompt, { shouldShowNotificationPrompt } from "../components/root/NotificationPrompt";
import { Asset } from "expo-asset";

const ModalStack = createStackNavigator();
const RootStack = createStackNavigator();

export enum RootRoutes {
    MODAL_NOTIFICATIONS = "Notifications",
    MODAL_ROOT = "Root Content",

    HOME = "Home",
    JOIN_FRIEND = "Join a Friend",
    CREATE_GAME = "Create Lobby",
    SETTINGS = "Device Settings"
}

function ConnectionButton({ onPress }: { onPress: () => void }) {
    return (
        <ConnectionButtonContainer onPress={onPress}>
            <MaterialCommunityIcons name="signal-cellular-outline" size={22} color="#f0e6d3" />
        </ConnectionButtonContainer>
    );
}

function SettingsButton({ onPress }: { onPress: () => void }) {
    return (
        <SettingsButtonContainer onPress={onPress}>
            <AntDesign name="setting" size={22} color="#f0e6d3" />
        </SettingsButtonContainer>
    );
}

// Content for the home screen.
function HomeContent() {
    const navigation = useNavigation();
    const sheetRef = useRef<BottomSheet | null>(null);
    const [darken] = useState(new Animated.Value(1));

    // set menu buttons
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <ConnectionButton
                    onPress={() => {
                        sheetRef.current!.snapTo(0);
                    }}
                />
            ),
            headerRight: () => (
                <SettingsButton
                    onPress={() => {
                        navigation.navigate(RootRoutes.SETTINGS);
                    }}
                />
            )
        });
    }, [navigation]);

    // check and possibly present notification modal
    useEffect(() => {
        shouldShowNotificationPrompt().then(async should => {
            if (!should) return;

            await Promise.all([
                Asset.fromModule(require("../assets/notifications/android.png")).downloadAsync(),
                Asset.fromModule(require("../assets/notifications/ios.png")).downloadAsync()
            ]);

            navigation.navigate(RootRoutes.MODAL_NOTIFICATIONS);
        });
    }, []);

    return (
        <>
            <Animated.View style={{ flex: 1, opacity: Animated.add(0.1, Animated.multiply(darken, 0.9)) }}>
                <NoLobby
                    onCreate={() => {
                        navigation.navigate(RootRoutes.CREATE_GAME);
                    }}
                    onJoin={() => {
                        navigation.navigate(RootRoutes.JOIN_FRIEND);
                    }}
                />
            </Animated.View>

            <BottomSheet
                ref={sheetRef}
                initialSnap={1}
                snapPoints={[CONNECTION_STATE_SHEET_HEIGHT, 0]}
                callbackNode={darken}
                renderContent={ConnectionStateSheet}
            />
        </>
    );
}

// Content of the main root (horizontal pushes)
function RootContent() {
    return (
        <RootStack.Navigator screenOptions={LCU_NAVBAR_STYLE}>
            <RootStack.Screen name={RootRoutes.HOME} component={HomeContent} />
            <RootStack.Screen name={RootRoutes.JOIN_FRIEND} component={JoinOpenLobby} />
            <RootStack.Screen name={RootRoutes.CREATE_GAME} component={CreateLobby} />
            <RootStack.Screen name={RootRoutes.SETTINGS} component={Settings} />
        </RootStack.Navigator>
    );
}

// Main root screen that contains a navigator for modals.
export default function Root() {
    return (
        <NavigationContainer>
            <ModalStack.Navigator mode="modal">
                <ModalStack.Screen
                    name={RootRoutes.MODAL_ROOT}
                    options={{ headerShown: false }}
                    component={RootContent}
                />

                <ModalStack.Screen
                    name={RootRoutes.MODAL_NOTIFICATIONS}
                    options={{ headerShown: false }}
                    component={NotificationPrompt}
                />
            </ModalStack.Navigator>
        </NavigationContainer>
    );
}

const ConnectionButtonContainer = styled(TouchableOpacity)`
    margin-left: 15px;
`;

const SettingsButtonContainer = styled(TouchableOpacity)`
    margin-right: 15px;
`;
