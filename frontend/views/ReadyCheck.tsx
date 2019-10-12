import * as React from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import { useObserver } from "mobx-react";

import ReadyCheckComponent from "../components/ready-check/ReadyCheck";
import readyCheck from "../stores/ready-check-store";

export default function ReadyCheck() {
    return useObserver(() => {
        if (!readyCheck.shouldShow) return <></>;

        return (
            <Container>
                <ReadyCheckComponent />
            </Container>
        );
    });
}

const Container = styled(View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.6);
`;
