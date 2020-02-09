import React, { useEffect, useState } from "react";
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
        shouldShowNotificationPrompt().then(setPromptingNotifications);
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
