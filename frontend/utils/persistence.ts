import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 } from "uuid";
import socket from "./socket";

const COMPUTERS = "computers";
const INSTALLATION_ID = "installation_id";
const SETTINGS = "settings";

/**
 * App-wide configuration options.
 */
export interface MimicSettings {
    hasShownIntroduction?: boolean;
    disableContinuousReadyCheckVibration?: boolean;
}

export async function getMimicSettings(): Promise<MimicSettings> {
    return JSON.parse((await AsyncStorage.getItem(SETTINGS)) || "{}");
}

export async function withMimicSettings(fn: (settings: MimicSettings) => any): Promise<void> {
    const settings = await getMimicSettings();
    fn(settings);
    await AsyncStorage.setItem(SETTINGS, JSON.stringify(settings));
}

/**
 * Configuration stored locally for a specified computer code.
 */
export interface ComputerConfig {
    name: string; // most recent computer name.
    hasPromptedForNotifications: boolean; // whether we've asked for push notifications yet
    readyCheckNotificationsEnabled: boolean;
    gameStartNotificationsEnabled: boolean;
    lastAccount?: {
        summonerName: string;
        iconId: number;
    };
}

export type RegisteredComputers = { [key: string]: ComputerConfig };

/**
 * Returns all the computers we've previously connected with. This returns a map
 * of { [computer code]: [last computer name] }.
 */
export async function getRegisteredComputers(): Promise<RegisteredComputers> {
    return JSON.parse((await AsyncStorage.getItem(COMPUTERS)) || "{}");
}

/**
 * Removes the computer with the specified code from the list of previously connected devices.
 */
export async function deleteRegisteredComputer(code: string) {
    const existing = await getRegisteredComputers();
    delete existing[code];

    await AsyncStorage.setItem(COMPUTERS, JSON.stringify(existing));
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

    await AsyncStorage.setItem(COMPUTERS, JSON.stringify(storage));

    return object;
}

/**
 * Returns a unique UUID that identifies this machine and persists across
 * restarts. It will not survive a reinstallation.
 */
export async function getInstallationId(): Promise<string> {
    const value = await AsyncStorage.getItem(INSTALLATION_ID);
    if (value) return value;

    const id = v4();
    await AsyncStorage.setItem(INSTALLATION_ID, id);
    return id;
}
