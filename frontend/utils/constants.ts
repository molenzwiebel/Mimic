import Constants from "expo-constants";
import { NotificationPlatform } from "./notifications";

export const RIFT_HOST = "http://192.168.1.29:51001";
export const RIFT_WS_HOST = "ws://192.168.1.29:51001";
export const CDN_HOST = "http://192.168.1.29:8080";

export function getNotificationPlatform() {
    return Constants.platform!.ios
        ? NotificationPlatform.IOS
        : Constants.platform!.android
        ? NotificationPlatform.ANDROID
        : NotificationPlatform.WEB;
}

export interface Role {
    name: string;
    key: string;
    image: any;
}

export const POSITION_NAMES: { [key: string]: string } = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "Bottom",
    UTILITY: "Support",
    FILL: "Fill"
};

export function getRoleImage(role: string) {
    if (role === "UNSELECTED") return require("../assets/roles/role-unselected.png");
    if (role === "TOP") return require("../assets/roles/role-top.png");
    if (role === "JUNGLE") return require("../assets/roles/role-jungle.png");
    if (role === "MIDDLE") return require("../assets/roles/role-mid.png");
    if (role === "BOTTOM" || role === "LANE") return require("../assets/roles/role-bot.png");
    if (role === "UTILITY") return require("../assets/roles/role-support.png");
    if (role === "FILL") return require("../assets/roles/role-fill.png");
    return "";
}

export function getMapBackground(mapId: number) {
    return (
        ({
            [10]: require("../assets/backgrounds/bg-tt.jpg"),
            [11]: require("../assets/backgrounds/bg-sr.jpg"),
            [12]: require("../assets/backgrounds/bg-ha.jpg"),
            [22]: require("../assets/backgrounds/bg-tft.jpg")
        } as any)[mapId] || require("../assets/backgrounds/magic-background.jpg")
    );
}

export const GAMEMODE_NAMES: { [key: string]: string } = {
    "8-ascension": "Ascension",
    "8-odin": "Definitely Not Dominion",
    "10-classic": "Twisted Treeline",
    "11-arsr": "ARSR",
    "11-assassinate": "Blood Moon",
    "11-classic": "Summoner’s Rift",
    "11-urf": "ARURF",
    "11-siege": "Nexus Siege",
    "11-lcurgmdisabled": "Rotating Game Mode",
    "12-aram": "ARAM",
    "12-portalparty": "Portal Party",
    "12-kingporo": "Legend of the Poro King",
    "12-basic_tutorial": "TUTORIAL",
    "11-battle_training": "BATTLE TRAINING",
    "11-tutorial_flow": "TUTORIAL",
    "16-darkstar": "Dark Star: Singularity",
    "18-starguardian": "Invasion",
    "11-doombotsteemo": "Doom Bots of Doom",
    "11-practicetool": "Practice Tool",
    "22-tft": "Teamfight Tactics"
};

// TODO: Review and remove?
export function getGamemodeName(key: string) {
    return GAMEMODE_NAMES[key.toLowerCase()] || "Rotating Game Mode";
}

export const ROLES: Role[] = [
    {
        name: "Top",
        key: "TOP",
        image: require("../assets/roles/role-top.png")
    },
    {
        name: "Jungle",
        key: "JUNGLE",
        image: require("../assets/roles/role-jungle.png")
    },
    {
        name: "Mid",
        key: "MIDDLE",
        image: require("../assets/roles/role-mid.png")
    },
    {
        name: "Bot",
        key: "BOTTOM",
        image: require("../assets/roles/role-bot.png")
    },
    {
        name: "Support",
        key: "UTILITY",
        image: require("../assets/roles/role-support.png")
    },
    {
        name: "Fill",
        key: "FILL",
        image: require("../assets/roles/role-fill.png")
    }
];
