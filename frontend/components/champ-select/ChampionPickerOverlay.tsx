import MagicBackgroundOverlay from "../MagicBackgroundOverlay";
import champSelect from "../../stores/champ-select-store";
import React, { useState } from "react";
import { observer } from "mobx-react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import LCUButton from "../LCUButton";
import styled from "styled-components/native";
import { bottomMargin } from "../../utils/notch";
import { championIconPath, getChampionSummary } from "../../utils/assets";
import ABImage from "../assets/ABImage";

const ChampionOption = observer(({ id }: { id: number }) => {
    const champ = getChampionSummary(id);
    const image = championIconPath(id);

    const isActive = champSelect.picking.selectedChampion === id;

    return (
        <TouchableOpacity onPress={() => champSelect.picking.selectChampion(id)}>
            <OptionContainer>
                <OptionImage active={isActive} path={image} />
                <OptionText>{champ.name}</OptionText>
            </OptionContainer>
        </TouchableOpacity>
    );
});

const ChampionOptions = observer(({ searchTerm }: { searchTerm: string }) => {
    const champs = champSelect.picking.getSelectableChampions(searchTerm);

    return (
        <ScrollView style={{ flex: 1 }}>
            <OptionsContainer>
                {champs.map(id => (
                    <ChampionOption id={id} key={id} />
                ))}
            </OptionsContainer>
        </ScrollView>
    );
});

const ChampionPicker = observer(() => {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <Container>
            <Search value={searchTerm} onChangeText={setSearchTerm} placeholder="Search..." />
            <ChampionOptions searchTerm={searchTerm} />

            <ConfirmButton
                type={champSelect.picking.buttonType}
                disabled={!champSelect.picking.canCompleteAction}
                onClick={() => champSelect.picking.completeAction()}>
                {champSelect.picking.buttonText}
            </ConfirmButton>
        </Container>
    );
});

function ChampionPickerOverlay() {
    const inChampSelect = champSelect.state && champSelect.state.localPlayer;
    const title = !inChampSelect ? "" : champSelect.picking.header;

    return (
        <MagicBackgroundOverlay
            title={title}
            visible={champSelect.interface.pickingChampion}
            marginTop={70}
            onClose={() => champSelect.interface.toggleChampionPicker()}>
            {inChampSelect && <ChampionPicker />}
        </MagicBackgroundOverlay>
    );
}

export default observer(ChampionPickerOverlay as any);

const Container = styled(View)`
    flex-direction: column;
    padding-bottom: ${bottomMargin}px;
    flex: 1;
`;

const Search = styled(TextInput).attrs({ placeholderTextColor: "#978d80" })`
    height: 40px;
    padding-left: 5px;
    background-color: black;
    font-family: "LoL Body";
    border: 1px solid #785a28;
    margin: 8px;
    font-size: 15px;
    color: #f0e6d3;
`;

const OptionsContainer = styled(View)`
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
`;

const ConfirmButton = styled(LCUButton)`
    margin: 5px;
`;

const OptionContainer = styled(View)`
    margin: 4px;
    flex-direction: column;
    align-items: center;
`;

const OptionImage: any = styled(ABImage)`
    width: 66px;
    height: 66px;
    opacity: ${(props: any) => (props.active ? 1 : 0.7)};
    border: 1px solid ${(props: any) => (props.active ? "#c89c3c" : "#3c3c41")};
`;

const OptionText = styled(Text).attrs(() => ({
    numberOfLines: 1,
    adjustsFontSizeToFit: true
}))`
    margin-top: 6px;
    color: #f0e6d3;
    width: 70px;
    text-align: center;
    font-family: "LoL Body";
`;
