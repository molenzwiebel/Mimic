import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import CreateLobby from "../components/root/CreateLobby";
import JoinOpenLobby from "../components/root/JoinOpenLobby";
import RootComponent from "../components/root/Root";
import Settings from "../components/root/Settings";
import NotificationPrompt, { shouldShowNotificationPrompt } from "../components/NotificationPrompt";

export default function Root() {
    const [creatingLobby, setCreatingLobby] = useState(false);
    const [joiningOpenLobby, setJoiningOpenLobby] = useState(false);
    const [viewingSettings, setViewingSettings] = useState(false);
    const [promptingNotifications, setPromptingNotifications] = useState(false);

    useEffect(() => {
        shouldShowNotificationPrompt().then(async should => {
            if (!should) return;

            await Promise.all([
                Asset.fromModule(require("../assets/notifications/android.png")).downloadAsync(),
                Asset.fromModule(require("../assets/notifications/ios.png")).downloadAsync()
            ]);

            setPromptingNotifications(true);
        });
    }, []);

    if (promptingNotifications) {
        return <NotificationPrompt onClose={() => setPromptingNotifications(false)} />;
    }

    if (creatingLobby) {
        return <CreateLobby onClose={() => setCreatingLobby(false)} />;
    }

    if (joiningOpenLobby) {
        return <JoinOpenLobby onClose={() => setJoiningOpenLobby(false)} />;
    }

    if (viewingSettings) {
        return <Settings onClose={() => setViewingSettings(false)} />;
    }

    return (
        <RootComponent
            onCreate={() => setCreatingLobby(true)}
            onJoin={() => setJoiningOpenLobby(true)}
            onSettings={() => setViewingSettings(true)}
        />
    );
}
