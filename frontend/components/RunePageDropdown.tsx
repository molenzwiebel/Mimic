import { observer } from "mobx-react";
import runes from "../stores/runes-store";
import { Picker, Platform, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import styled from "styled-components/native";

const RunePageDropdown = observer(() => {
    const value: number = (runes.runePages.find(x => x.isActive) || { id: 0 }).id;
    const options = runes.runePages.map(x => ({
        label: x.name,
        value: "" + x.id,
        key: "" + x.id
    }));

    if (Platform.OS === "web")
        return (
            <RunePagePicker value={value} onValueChange={(id: number) => runes.selectPage(id)}>
                {options.map(x => (
                    <Picker.Item {...x} />
                ))}
            </RunePagePicker>
        );

    return (
        <RunePagePicker>
            <RNPickerSelect
                style={{
                    inputIOS: runePageStyling,
                    inputAndroid: runePageStyling
                }}
                value={value}
                placeholder={{ label: "Select a rune page...", value: null }}
                onValueChange={id => runes.selectPage(id)}
                items={options}
                Icon={() => {
                    return (
                        <Ionicons
                            style={{ marginTop: 5, marginRight: 5 }}
                            name="md-arrow-dropdown"
                            size={18}
                            color="#695625"
                        />
                    );
                }}
            />
        </RunePagePicker>
    );
});

export default RunePageDropdown;

const runePageStyling = {
    width: "100%",
    fontFamily: "LoL Body",
    fontSize: 16,
    padding: 4,
    marginRight: 10
};

const RunePagePicker: any = styled(Platform.OS === "web" ? Picker : View)`
    flex: 1;
    background-color: rgb(30, 35, 40);
    border: 1px solid #695625;
    color: #a09b8c;
    padding: 4px;
    margin-right: 10px;
`;
