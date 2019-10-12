import styled from "styled-components/native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { bottomMargin } from "../../utils/notch";
import React from "react";
import champSelect from "../../stores/champ-select-store";
import { Ionicons } from "@expo/vector-icons";
import CircularLCUButton from "../CircularLCUButton";
import { getSummonerSpellImage } from "../../utils/constants";
import { observer } from "mobx-react";
import RunePageDropdown from "../RunePageDropdown";

const BUTTON_CONTAINER_HEIGHT = 25;

const RerollFloatingButtons = () => {
    const canReroll = champSelect.rerollState.numberOfRolls >= 1;

    return (
        <>
            <TouchableOpacity onPress={() => champSelect.picking.reroll()} disabled={!canReroll}>
                <RerollFloatingButtonContainer>
                    <Ionicons name="ios-refresh" size={15} color="#b6dbdb" />
                    <RerollBenchText unavailable={canReroll ? undefined : "true"}>
                        REROLL ({champSelect.rerollState.numberOfRolls}/{champSelect.rerollState.maxRolls})
                    </RerollBenchText>
                </RerollFloatingButtonContainer>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => champSelect.interface.toggleBench()}>
                <RerollFloatingButtonContainer style={{ width: 100 }}>
                    <Ionicons name="ios-arrow-up" size={15} color="white" />
                    <RerollBenchText>BENCH</RerollBenchText>
                </RerollFloatingButtonContainer>
            </TouchableOpacity>
        </>
    );
};

const FloatingButtons = () => {
    const hasReroll = champSelect.state && champSelect.state.benchEnabled;

    return (
        <ButtonsContainer>
            {/* Expand button if we can't reroll. */}
            {!hasReroll && (
                <TouchableOpacity onPress={() => champSelect.interface.toggleChampionPicker()}>
                    <FloatingButtonContainer>
                        <Ionicons name="ios-arrow-up" size={20} color="white" />
                    </FloatingButtonContainer>
                </TouchableOpacity>
            )}

            {/* Else the reroll/bench buttons. */}
            {hasReroll && <RerollFloatingButtons />}
        </ButtonsContainer>
    );
};

function PlayerSettings() {
    return (
        <Container>
            <RunePageDropdown />

            <CircularLCUButton size={35} onClick={() => champSelect.interface.toggleRuneEditor()}>
                <Ionicons name="md-create" size={15} color="white" />
            </CircularLCUButton>

            <TouchableOpacity onPress={() => champSelect.interface.toggleSpellPicker(true)}>
                <SpellImage
                    source={{
                        uri: getSummonerSpellImage(champSelect.state!.localPlayer.spell1Id)
                    }}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => champSelect.interface.toggleSpellPicker(false)}>
                <SpellImage
                    source={{
                        uri: getSummonerSpellImage(champSelect.state!.localPlayer.spell2Id)
                    }}
                />
            </TouchableOpacity>

            <FloatingButtons />
        </Container>
    );
}

export default observer(PlayerSettings as any);

const Container = styled(View)`
    padding: 10px;
    padding-bottom: ${bottomMargin + 10}px;
    border: 0px solid rgba(240, 230, 210, 0.2);
    border-top-width: 1px;
    background-color: rgba(0, 0, 0, 0.7);
    flex-direction: row;
    align-items: center;
`;

const SpellImage = styled(Image)`
    margin-left: 10px;
    width: 45px;
    height: 45px;
`;

const ButtonsContainer = styled(View)`
    position: absolute;
    top: -${BUTTON_CONTAINER_HEIGHT}px;
    height: ${BUTTON_CONTAINER_HEIGHT}px;
    left: 0;
    right: 0;
    flex-direction: row;
    justify-content: center;
`;

const FloatingButtonContainer = styled(View)`
    width: 60px;
    height: ${BUTTON_CONTAINER_HEIGHT}px;
    align-items: center;
    justify-content: center;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border: 1px solid rgba(240, 230, 210, 0.7);
    border-bottom-width: 0;
    background-color: rgba(0, 0, 0, 0.7);
`;

const RerollFloatingButtonContainer = styled(FloatingButtonContainer)`
    width: 130px;
    margin-right: 10px;
    border-color: #0596aa;
    flex-direction: row;
`;

const RerollBenchText: any = styled(Text)`
    margin-left: 5px;
    color: ${(props: any) => (props.unavailable ? "#657a7a" : "#b6dbdb")};
    font-size: 16px;
    font-family: "LoL Display";
`;
