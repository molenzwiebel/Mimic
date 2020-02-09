import { Ionicons } from "@expo/vector-icons";
import { AppLoading } from "expo";
import * as Font from "expo-font";
import { observer } from "mobx-react";
import { default as React } from "react";
import { StatusBar, YellowBox } from "react-native";
import Mimic from "./views/Mimic";
import { loadDdragon } from "./utils/constants";
import { Asset } from "expo-asset";
import { registerForNotifications } from "./utils/notifications";

// every platform supports this, yet somehow react native doesn't like it?
YellowBox.ignoreWarnings([
    "Warning: Failed prop type: Invalid props.style key `borderStyle` supplied to `Image`.",
    "Require cycle:",
    "Warning: componentWillReceiveProps has been renamed"
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
        await Font.loadAsync({
            "LoL Display": require("./assets/fonts/BeaufortforLOL-Regular.ttf"),
            "LoL Display Bold": require("./assets/fonts/BeaufortforLOL-Bold.ttf"),
            "LoL Body": require("./assets/fonts/Spiegel-Regular.ttf"),
            ...Ionicons.font
        });
        await Asset.fromModule(require("./assets/backgrounds/magic-background.jpg")).downloadAsync();
        await loadDdragon();
        await registerForNotifications();
    };
}
