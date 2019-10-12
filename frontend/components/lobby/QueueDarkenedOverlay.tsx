import React from "react";
import { useObserver } from "mobx-react";
import queue from "../../stores/queue-store";
import styled from "styled-components/native";
import { View } from "react-native";

/**
 * Simple view that presents a fullscreen dark layout if we're in queue.
 */
export default function QueueDarkenedOverlay() {
    return useObserver(() => {
        if (!queue.state || !queue.state.isCurrentlyInQueue) return <></>;

        return <DarkenedOverlay />;
    });
}

const DarkenedOverlay = styled(View)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
`;