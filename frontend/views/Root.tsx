import React, { useState } from "react";
import CreateLobby from "../components/root/CreateLobby";
import JoinOpenLobby from "../components/root/JoinOpenLobby";
import RootComponent from "../components/root/Root";
import Settings from "../components/root/Settings";

export default function Root() {
    const [creatingLobby, setCreatingLobby] = useState(false);
    const [joiningOpenLobby, setJoiningOpenLobby] = useState(false);
    const [viewingSettings, setViewingSettings] = useState(false);

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
