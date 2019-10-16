import React, { Component } from "react";
import { observer } from "mobx-react";
import { observable } from "mobx";
import socket from "../utils/socket";
import Intro from "../components/connect/Intro";
import CodeEntry from "../components/connect/CodeEntry";
import ConnectionState from "../components/connect/ConnectionState";
import { getRegisteredComputers, markIntroShown, shouldShowIntro } from "../utils/persistence";
import PreviousDevices from "../components/connect/PreviousDevices";

@observer
export default class Connect extends Component {
    @observable
    showingIntro = false;

    @observable
    addingNewComputer = false;

    constructor(props: {}) {
        super(props);

        // Show intro if we haven't launched before.
        shouldShowIntro().then(result => {
            if (!result) return;

            this.showingIntro = true;
        });

        // Skip the list of devices if we don't have any
        getRegisteredComputers().then(result => {
            if (Object.keys(result).length) return;

            this.addingNewComputer = true;
        });
    }

    private async showIntro() {
        this.showingIntro = true;
    }

    private async dismissIntro() {
        await markIntroShown();
        this.showingIntro = false;
    }

    render() {
        if (this.showingIntro) {
            return <Intro onDone={() => this.dismissIntro()} />;
        }

        if (socket.state !== null) {
            return <ConnectionState />;
        }

        if (this.addingNewComputer) {
            return <CodeEntry showIntro={() => this.showIntro()} />;
        }

        return <PreviousDevices onRegisterNew={() => (this.addingNewComputer = true)} />;
    }
}
