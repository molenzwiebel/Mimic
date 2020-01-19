import { default as React } from "react";
import { observer } from "mobx-react";
import { Text } from "react-native";
import RootSubview from "./RootSubview";

export default function Settings({ onClose }: { onClose: Function }) {
    return (
        <RootSubview title="Settings" onClose={onClose}>
            <Text>Hi</Text>
        </RootSubview>
    );
}
