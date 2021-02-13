import { Ionicons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
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

// every platform supports this, yet somehow react native doesn't like it?
LogBox.ignoreLogs([
    "Warning: Failed prop type: Invalid props.style key `borderStyle` supplied to `Image`.",
    "Require cycle:",
    "Warning: componentWillReceiveProps has been renamed",
    "Warning: componentWillMount has been renamed"
]);

@observer
export default class App extends React.Component {
    state = { isReady: false };

    render() {
        if (!this.state.isReady)
            return (
                <AppLoading startAsync={this.loadResources} onFinish={this.handleLoadComplete} onError={console.warn} />
            );

        return <Mimic />;
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
                ...MaterialCommunityIcons.font
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
