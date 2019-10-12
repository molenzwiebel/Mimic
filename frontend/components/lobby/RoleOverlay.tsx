import lobby from "../../stores/lobby-store";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity } from "react-native";
import { observer } from "mobx-react";
import styled from "styled-components/native";
import { Role, ROLES } from "../../utils/constants";
import MagicBackgroundOverlay from "../MagicBackgroundOverlay";

const RoleOption = ({ role }: { role: Role }) => (
    <RoleContainer onPress={() => lobby.selectRole(role.key)}>
        <RoleImage source={role.image} />
        <RoleName>{role.name}</RoleName>
    </RoleContainer>
);

function RoleOverlay() {
    return (
        <MagicBackgroundOverlay
            marginTop={60}
            visible={lobby.roleOverlayOpen}
            title={`Select ${lobby.isPickingFirstRole ? "First" : "Second"} Role`}
            onClose={() => lobby.toggleRoleOverlay(true)}>
            <ScrollView>
                {ROLES.map(x => (
                    <RoleOption role={x} key={x.key} />
                ))}
            </ScrollView>
        </MagicBackgroundOverlay>
    );
}

export default observer(RoleOverlay as any);

const RoleContainer = styled(TouchableOpacity)`
    flex-direction: row;
    align-items: center;
    padding: 10px;
    border: 1px solid rgba(205, 190, 147, 0.2);
    border-top-width: 0;
    border-left-width: 0;
    border-right-width: 0;
`;

const RoleImage = styled(Image)`
    width: 40px;
    height: 40px;
`;

const RoleName = styled(Text)`
    margin-left: 15px;
    font-family: "LoL Display";
    font-size: 30px;
    color: #f0e6d3;
`;
