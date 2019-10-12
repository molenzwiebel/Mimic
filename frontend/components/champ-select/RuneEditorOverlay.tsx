import MagicBackgroundOverlay from "../MagicBackgroundOverlay";
import champSelect from "../../stores/champ-select-store";
import runes from "../../stores/runes-store";
import React from "react";
import { observer } from "mobx-react";
import styled from "styled-components/native";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import RunePageDropdown from "../RunePageDropdown";
import CircularLCUButton from "../CircularLCUButton";
import { Ionicons } from "@expo/vector-icons";
import { getRuneTree, getRuneTrees, RuneSlot, RuneTree } from "../../utils/constants";
import { bottomMargin } from "../../utils/notch";

const STAT_MODS = [[5008, 5005, 5007], [5008, 5002, 5003], [5001, 5002, 5003]];

const STAT_DESCRIPTIONS: { [key: number]: string } = {
    5008: "AP/AD",
    5005: "ATKSPD",
    5007: "CDR",
    5002: "ARMOR",
    5003: "MR",
    5001: "HP"
};

function Diamond({ last }: { last: boolean }) {
    return (
        <DiamondContainer>
            <DiamondBar last={last || undefined} />
            <DiamondText>◆</DiamondText>
        </DiamondContainer>
    );
}

function Toolbar() {
    return (
        <ToolbarContainer>
            <RunePageDropdown />

            <ToolbarButton size={35} onClick={() => runes.addPage()}>
                <Ionicons name="md-add" size={18} color="#cebf93" />
            </ToolbarButton>

            <ToolbarButton size={35} onClick={() => runes.removePage()}>
                <Ionicons name="ios-trash" size={18} color="#cebf93" />
            </ToolbarButton>
        </ToolbarContainer>
    );
}

function StylePicker({ selected, onSelect }: { selected: number; onSelect: (id: number) => any }) {
    const trees = getRuneTrees();
    const treeImage = (tree: RuneTree) => `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`;

    return (
        <StyleContainer>
            {trees.map(tree => (
                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    key={tree.id}
                    onPress={() => onSelect(tree.id)}>
                    <StyleOption>
                        <StyleIcon
                            selected={selected === tree.id ? true : undefined}
                            source={{ uri: treeImage(tree) }}
                        />
                    </StyleOption>
                </TouchableOpacity>
            ))}
        </StyleContainer>
    );
}

function SlotPicker({
    selected,
    slot,
    onSelect,
    keystone = false,
    last = false
}: {
    selected: number[];
    slot: RuneSlot;
    onSelect: (id: number) => any;
    keystone?: boolean;
    last?: boolean;
}) {
    const runeImage = (tree: { icon: string }) => `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`;

    return (
        <SlotContainer>
            <Diamond last={last} />

            {slot.runes.map(rune => (
                <TouchableOpacity
                    style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    key={rune.id}
                    onPress={() => onSelect(rune.id)}>
                    <SlotOption
                        selected={selected.includes(rune.id) ? true : undefined}
                        keystone={keystone || undefined}>
                        <SlotIcon
                            selected={selected.includes(rune.id) ? true : undefined}
                            source={{ uri: runeImage(rune) }}
                        />
                    </SlotOption>
                </TouchableOpacity>
            ))}
        </SlotContainer>
    );
}

function StatModPicker({
    selected,
    options,
    onSelect
}: {
    selected: number;
    options: number[];
    onSelect: (id: number) => any;
}) {
    const runeImage = (id: number) => `https://stelar7.no/cdragon/latest/perks/${id}.png`;

    return (
        <StatModContainer>
            {options.map(id => (
                <TouchableOpacity
                    style={{
                        flex: 1,
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    key={id}
                    onPress={() => onSelect(id)}>
                    <StatModOption selected={selected === id || undefined}>
                        <StatModIcon selected={selected === id || undefined} source={{ uri: runeImage(id) }} />
                    </StatModOption>
                    <StatModText selected={selected === id || undefined}>{STAT_DESCRIPTIONS[id]}</StatModText>
                </TouchableOpacity>
            ))}
        </StatModContainer>
    );
}

const RunePageEditor = observer(() => {
    const page = runes.currentPage;
    if (!page) return null; // no page means we can't edit anything'

    const mainStyle = page.primaryStyleId ? getRuneTree(page.primaryStyleId) : null;
    const secondaryStyle = page.subStyleId ? getRuneTree(page.subStyleId) : null;

    return (
        <EditorContainer>
            <SectionTitle>PRIMARY TREE</SectionTitle>
            <StylePicker selected={page.primaryStyleId} onSelect={id => runes.selectPrimaryTree(id)} />
            {mainStyle &&
                mainStyle.slots.map((slot, i) => (
                    <SlotPicker
                        keystone={i === 0}
                        last={i === 3}
                        selected={page.selectedPerkIds.slice(0, 4)}
                        slot={slot}
                        onSelect={id => runes.selectPrimaryRune(i, id)}
                        key={i}
                    />
                ))}

            <SectionTitle style={{ marginTop: 10 }}>SECONDARY TREE</SectionTitle>
            <StylePicker selected={page.subStyleId} onSelect={id => runes.selectSecondaryTree(id)} />
            {secondaryStyle &&
                secondaryStyle.slots
                    .slice(1)
                    .map((slot, i) => (
                        <SlotPicker
                            selected={page.selectedPerkIds.slice(4, 6)}
                            slot={slot}
                            last={i === 2}
                            onSelect={id => runes.selectSecondaryRune(id)}
                            key={i}
                        />
                    ))}

            <SectionTitle style={{ marginTop: 10 }}>STAT MODS</SectionTitle>
            {STAT_MODS.map((options, i) => (
                <StatModPicker
                    selected={page.selectedPerkIds[6 + i]}
                    options={options}
                    onSelect={id => runes.selectStatRune(i, id)}
                    key={i}
                />
            ))}
        </EditorContainer>
    );
});

function RuneEditorContainer() {
    return (
        <Container>
            <Toolbar />
            <RunePageEditor />
        </Container>
    );
}

function RuneEditorOverlay() {
    return (
        <MagicBackgroundOverlay
            title="Edit Rune Pages"
            visible={champSelect.interface.showingRuneOverlay}
            marginTop={70}
            onClose={() => champSelect.interface.toggleRuneEditor()}>
            <RuneEditorContainer />
        </MagicBackgroundOverlay>
    );
}

export default observer(RuneEditorOverlay as any);

const Container = styled(ScrollView)``;

const EditorContainer = styled(View)`
    flex-direction: column;
    width: 100%;
    margin-bottom: ${bottomMargin}px;
`;

const SectionTitle = styled(Text)`
    font-family: "LoL Display";
    font-size: 18px;
    padding: 5px 5px 10px 10px;
    color: #f0e6d2;
    font-weight: bold;
    letter-spacing: 1px;
`;

const StyleContainer = styled(View)`
    width: 100%;
    flex-direction: row;
    border: 0px solid #c89c3c;
    border-bottom-width: 2px;
`;

const StyleOption = styled(View)`
    width: 50px;
    height: 50px;
    align-items: center;
    justify-content: center;
    border-radius: 25px;
`;

const StyleIcon: any = styled(Image)`
    width: 60%;
    height: 60%;
    ${(props: any) => (props.selected ? "" : `tint-color: gray;`)}
`;

const SlotContainer = styled(View)`
    width: 100%;
    flex-direction: row;
`;

const SlotOption: any = styled(View)`
    width: ${(props: any) => (props.keystone ? 70 : 50)}px;
    height: ${(props: any) => (props.keystone ? 70 : 50)}px;
    margin-top: 20px;
    align-items: center;
    justify-content: center;
    border-radius: ${(props: any) => (props.keystone ? 35 : 25)}px;
    ${(props: any) => (props.selected ? `border: 2px solid #c89c3c;` : "")}
`;

const SlotIcon: any = styled(Image)`
    width: 100%;
    height: 100%;
    ${(props: any) => (props.selected ? "" : `opacity: 0.6;`)}
`;

const StatModContainer = styled(View)`
    width: 100%;
    margin: 10px;
    flex-direction: row;
`;

const DiamondContainer = styled(View)`
    flex: 0 40px;
    margin-left: 10px;
    align-self: stretch;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const DiamondBar: any = styled(View)`
    position: absolute;
    top: 0;
    left: 18px;
    width: 4px;
    background-color: #785b28;
    z-index: -1;
    height: ${(props: any) => (props.last ? "55%" : "100%")};
`;

const DiamondText = styled(Text)`
    margin-top: 20px;
    color: #c8aa6e;
    font-size: 20px;
`;

const StatModOption: any = styled(View)`
    width: 45px;
    height: 45px;
    align-items: center;
    justify-content: center;
    border-radius: 22.5px;
    ${(props: any) => (props.selected ? `border: 2px solid #c89c3c;` : "")}
`;

const StatModIcon: any = styled(Image)`
    width: 100%;
    height: 100%;
    ${(props: any) => (props.selected ? "" : `opacity: 0.6;`)}
`;

const StatModText: any = styled(Text)`
    margin-top: 10px;
    color: #c8aa6e;
    font-size: 16px;
    font-family: LoL Display;
    ${(props: any) => (props.selected ? "" : `opacity: 0.6;`)}
`;

const ToolbarContainer = styled(View)`
    flex-direction: row;
    margin: 10px;
`;

const ToolbarButton = styled(CircularLCUButton)`
    margin-left: 5px;
`;
