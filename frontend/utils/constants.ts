import Constants from "expo-constants";
import { NotificationPlatform } from "./notifications";

export interface RuneSlot {
    runes: {
        id: number;
        icon: string;
    }[];
}

export interface RuneTree {
    id: number;
    icon: string;
    slots: RuneSlot[];
}

let ddragonVersion: string;
let runeTrees: RuneTree[];
let championDetails: {
    [id: number]: { id: string; key: string; name: string };
};
let summonerSpellDetails: {
    [id: number]: { id: string; key: string; name: string };
};

export const RIFT_HOST = "http://localhost:51001";
export const RIFT_WS_HOST = "ws://localhost:51001";

export async function loadDdragon() {
    try {
        const versions = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(x => x.json());
        ddragonVersion = versions[0];

        championDetails = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/champion.json`
        )
            .then(x => x.json())
            .then(map => {
                // map to { id: data }
                const details: any = {};
                Object.keys(map.data).forEach(x => (details[+map.data[x].key] = map.data[x]));
                return details;
            });

        summonerSpellDetails = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/summoner.json`
        )
            .then(x => x.json())
            .then(map => {
                // map to { id: data }
                const details: any = {};
                Object.keys(map.data).forEach(x => (details[+map.data[x].key] = map.data[x]));
                return details;
            });

        runeTrees = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/runesReforged.json`
        ).then(x => x.json());
    } catch {
        ddragonVersion = "9.14.1";
    }
}

export function getNotificationPlatform() {
    return Constants.platform!.ios
        ? NotificationPlatform.IOS
        : Constants.platform!.android
            ? NotificationPlatform.ANDROID
            : NotificationPlatform.WEB;
}

export function getPlayerAvatarURL(icon: number) {
    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${icon}.png`;
}

export function getChampionIcon(id: number) {
    return `http://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${championDetails[id].id}.png`;
}

export function getChampion(id: number) {
    return championDetails[id];
}

export function getSummonerSpell(id: number) {
    return summonerSpellDetails[id];
}

export function getRuneTree(id: number) {
    return runeTrees.find(x => x.id === id)!;
}

export function getSecondaryRuneTree(id: number) {
    return runeTrees.find(x => x.id !== id)!;
}

export function getRuneTrees() {
    return runeTrees;
}

export function getSummonerSpellImage(id: number) {
    return `http://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${summonerSpellDetails[id].id}.png`;
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
    if (role === "BOTTOM") return require("../assets/roles/role-bot.png");
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
