import MagicBackgroundOverlay from "../MagicBackgroundOverlay";
import champSelect from "../../stores/champ-select-store";
import React from "react";
import { observer } from "mobx-react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import styled from "styled-components/native";
import { getSummonerSpell, getSummonerSpellImage } from "../../utils/constants";

const SpellOption = ({ spellId }: { spellId: number }) => {
    const spell = getSummonerSpell(spellId);

    return (
        <TouchableOpacity onPress={() => champSelect.spells.selectSummonerSpell(spellId)}>
            <SpellContainer>
                <SpellImage source={{ uri: getSummonerSpellImage(spellId) }} />
                <SpellName>{spell.name}</SpellName>
            </SpellContainer>
        </TouchableOpacity>
    );
};

function SpellPickerOverlay() {
    return (
        <MagicBackgroundOverlay
            title="Select Summoner Spell"
            visible={champSelect.interface.pickingSummonerSpell}
            marginTop={70}
            onClose={() => champSelect.interface.toggleSpellPicker(true)}>
            <ScrollView alwaysBounceVertical={false}>
                {champSelect.spells.availableSummoners.map(x => (
                    <SpellOption spellId={x.id} key={x.id} />
                ))}
            </ScrollView>
        </MagicBackgroundOverlay>
    );
}

export default observer(SpellPickerOverlay as any);

const SpellContainer = styled(View)`
    padding: 10px;
    flex-direction: row;
    align-items: center;
    border: 0px solid rgba(205, 190, 147, 0.3);
    border-bottom-width: 1px;
`;

const SpellImage = styled(Image)`
    width: 40px;
    height: 40px;
`;

const SpellName = styled(Text)`
    font-family: "LoL Display";
    font-size: 25px;
    margin-left: 10px;
    color: white;
`;
