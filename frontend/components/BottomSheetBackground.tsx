import React, { RefObject } from "react";
import BottomSheet from "reanimated-bottom-sheet";
import { TouchableWithoutFeedback } from "react-native";
import Animated from "react-native-reanimated";

/**
 * Simple full-sized black background that darkens as the bottom sheet rises. When
 * tapping on the background will dismiss the sheet. Once the sheet is fully dismissed,
 * the background will be moved offscreen.
 */
export function BottomSheetBackground({ sheetRef, darken }: { sheetRef: RefObject<BottomSheet>; darken: any }) {
    return (
        <TouchableWithoutFeedback
            onPress={() => {
                sheetRef.current!.snapTo(1);
            }}>
            <Animated.View
                style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    zIndex: 10,
                    backgroundColor: "black",
                    left: Animated.cond(Animated.eq(darken, 1), [-100000], [0]),
                    opacity: Animated.interpolate(darken, {
                        inputRange: [0, 1],
                        outputRange: [0.8, 0]
                    })
                }}
            />
        </TouchableWithoutFeedback>
    );
}
