import { TouchableOpacity, Image } from "react-native";
import styled from "styled-components/native";
import React from "react";

export default function LCUCheckbox({ checked, onToggle }: { checked: boolean; onToggle: Function }) {
    return (
        <CheckboxOuter onPress={() => onToggle()}>
            {checked && <CheckboxInner source={require("../assets/icons/check.png")} />}
        </CheckboxOuter>
    );
}

const CheckboxOuter = styled(TouchableOpacity)`
    width: 22px;
    height: 22px;
    border: 1px solid rgb(120, 90, 40);
`;

const CheckboxInner = styled(Image)`
    position: absolute;
    width: 14px;
    top: 3px;
    left: 3px;
    height: 14px;
`;
