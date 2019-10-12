import { Alert } from "react-native";

export default async function _confirm(title: string, body: string): Promise<boolean> {
    if (typeof confirm !== "undefined") return confirm(body);

    return await new Promise(resolve => {
        Alert.alert(
            title,
            body,
            [
                {
                    text: "Cancel",
                    onPress: () => resolve(false),
                    style: "cancel",
                },
                { text: "OK", onPress: () => resolve(true) },
            ],
            { cancelable: false },
        );
    });
}