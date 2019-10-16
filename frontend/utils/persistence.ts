import { AsyncStorage } from "react-native";

export async function shouldShowIntro(): Promise<boolean> {
    return (await AsyncStorage.getItem("introShown")) === null;
}

export async function markIntroShown() {
    await AsyncStorage.setItem("introShown", "true");
}

/**
 * Returns all the computers we've previously connected with. This returns a map
 * of { [computer code]: [last computer name] }.
 */
export async function getRegisteredComputers(): Promise<{ [key: string]: string }> {
    return JSON.parse(await AsyncStorage.getItem("computers") || "{}");
}

/**
 * Removes the computer with the specified code from the list of previously connected devices.
 */
export async function deleteRegisteredComputer(code: string) {
    const existing = await getRegisteredComputers();
    delete existing[code];

    await AsyncStorage.setItem("computers", JSON.stringify(existing));
}

/**
 * Registers the specified device in the list of cached computers.
 */
export async function registerConnectedComputer(code: string, deviceName: string) {
    const existing = await getRegisteredComputers();
    existing[code] = deviceName;

    await AsyncStorage.setItem("computers", JSON.stringify(existing));
}