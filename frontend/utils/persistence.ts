import { AsyncStorage } from "react-native";
import socket from "./socket";

export async function shouldShowIntro(): Promise<boolean> {
    return (await AsyncStorage.getItem("introShown")) === null;
}

export async function markIntroShown() {
    await AsyncStorage.setItem("introShown", "true");
}

/**
 * Configuration stored locally for a specified computer code.
 */
export interface ComputerConfig {
    name: string; // most recent computer name.
    hasPromptedForNotifications: boolean; // whether we've asked for push notifications yet
    readyCheckNotificationsEnabled: boolean;
    gameStartNotificationsEnabled: boolean;
}

/**
 * Returns all the computers we've previously connected with. This returns a map
 * of { [computer code]: [last computer name] }.
 */
export async function getRegisteredComputers(): Promise<{ [key: string]: ComputerConfig }> {
    return JSON.parse((await AsyncStorage.getItem("computers")) || "{}");
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
 * Fetches the computer config for the current computer, runs the specified
 * function on the config, then writes the (possibly modified) config back
 * to storage. Returns the config.
 */
export async function withComputerConfig(fn: (config: ComputerConfig) => any = () => {}): Promise<ComputerConfig> {
    const storage = await getRegisteredComputers();
    let object = storage[socket.code];

    if (!object) {
        object = storage[socket.code] = {
            name: "Computer",
            hasPromptedForNotifications: false,
            readyCheckNotificationsEnabled: false,
            gameStartNotificationsEnabled: false
        };
    }

    await fn(object);

    await AsyncStorage.setItem("computers", JSON.stringify(storage));

    return object;
}
