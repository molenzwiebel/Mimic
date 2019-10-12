import * as React from "react";
import { useObserver } from "mobx-react-lite";
import champSelect from "../stores/champ-select-store";
import { ImageBackground } from "react-native";
import styled from "styled-components/native";
import Timer from "../components/champ-select/Timer";
import Members from "../components/champ-select/Members";
import PlayerSettings from "../components/champ-select/PlayerSettings";
import SpellPickerOverlay from "../components/champ-select/SpellPickerOverlay";
import ChampionPickerOverlay from "../components/champ-select/ChampionPickerOverlay";
import RuneEditorOverlay from "../components/champ-select/RuneEditorOverlay";
import BenchOverlay from "../components/champ-select/BenchOverlay";

export default function ChampionSelect() {
    return useObserver(() => {
        if (!champSelect.state) return null;

        return <Container source={champSelect.interface.background}>
            <Timer/>
            <Members/>
            <PlayerSettings/>

            {/* Absolute Positioned Elements */}
            <SpellPickerOverlay/>
            <RuneEditorOverlay/>
            <ChampionPickerOverlay/>
            <BenchOverlay/>
        </Container>;
    });
}

const Container = styled(ImageBackground)`
    flex: 1;
    height: 100%;
    flex-direction: column;
`;