import "react-native-get-random-values"; // must be first: uuid requires it.
import { Ionicons, AntDesign, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AppLoading from "expo-app-loading";
import * as Font from "expo-font";
import { observer } from "mobx-react";
import { default as React } from "react";
import { StatusBar, LogBox } from "react-native";
import Mimic from "./views/Mimic";
import { Asset } from "expo-asset";
import * as assetBundle from "./utils/asset-bundle";
import * as assets from "./utils/assets";
import { registerForNotifications, updateRemoteNotificationToken } from "./utils/notifications";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

// every platform supports this, yet somehow react native doesn't like it?
if (LogBox) {
    // logbox is undefined on web
    LogBox.ignoreLogs([
        "Warning: Failed prop type: Invalid props.style key `borderStyle` supplied to `Image`.",
        "Require cycle:",
        "Warning: componentWillReceiveProps has been renamed",
        "Warning: componentWillMount has been renamed",
        "Setting a timer"
    ]);
}

@observer
export default class App extends React.Component {
    state = { isReady: false };

    render() {
        if (!this.state.isReady)
            return (
                <AppLoading startAsync={this.loadResources} onFinish={this.handleLoadComplete} onError={console.warn} />
            );

        return (
            <ActionSheetProvider>
                <Mimic />
            </ActionSheetProvider>
        );
    }

    private handleLoadComplete = () => {
        StatusBar.setBarStyle("light-content", true);
        this.setState({ isReady: true });
    };

    private loadResources = async () => {
        await Promise.all([
            Font.loadAsync({
                "LoL Display": require("./assets/fonts/BeaufortforLOL-Regular.ttf"),
                "LoL Display Bold": require("./assets/fonts/BeaufortforLOL-Bold.ttf"),
                "LoL Body": require("./assets/fonts/Spiegel-Regular.ttf"),
                ...Ionicons.font,
                ...AntDesign.font,
                ...MaterialCommunityIcons.font,
                ...MaterialIcons.font
            }),
            Asset.fromModule(require("./assets/backgrounds/magic-background.jpg")).downloadAsync(),
            assetBundle.initializeStaticAssets().then(() => assets.initialize()),
            registerForNotifications()
        ]);

        // Send our potentially changed PN token to server on startup.
        updateRemoteNotificationToken().catch(() => {
            /* Ignored */
        });
    };
}
