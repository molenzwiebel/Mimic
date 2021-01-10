import MagicBackgroundOverlay from "../MagicBackgroundOverlay";
import champSelect from "../../stores/champ-select-store";
import React from "react";
import { observer } from "mobx-react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import styled from "styled-components/native";
import ChampionBackground from "../ChampionBackground";
import { getChampionSummary } from "../../utils/assets";

const BenchChampionOption = observer(({ id }: { id: number }) => {
    const champ = getChampionSummary(id);

    return (
        <TouchableOpacity onPress={() => champSelect.picking.swapWithChampion(id)}>
            <Champion>
                <ChampionBackground championId={id} skinId={0} />
                <ChampionName>{champ.name}</ChampionName>
            </Champion>
        </TouchableOpacity>
    );
});

function BenchOverlay() {
    return (
        <MagicBackgroundOverlay
            title="Champion Bench"
            visible={champSelect.interface.showingBench}
            marginTop={70}
            onClose={() => champSelect.interface.toggleBench()}>
            <ScrollView alwaysBounceVertical={false}>
                {champSelect.state &&
                    champSelect.state.benchChampionIds.map(x => <BenchChampionOption id={x} key={x} />)}
            </ScrollView>
        </MagicBackgroundOverlay>
    );
}
export default observer(BenchOverlay as any);

const Champion = styled(View)`
    height: 80px;
    width: 100%;
    border: 0 solid #785a28;
    border-bottom-width: 1px;
    flex-direction: row;
    align-items: center;
`;

const ChampionName = styled(Text)`
    font-size: 24px;
    margin-left: 15px;
    font-family: "LoL Display Bold";
    color: #efe5d1;
`;
