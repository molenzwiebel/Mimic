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
let championDetails: { [id: number]: { id: string, key: string, name: string } };
let summonerSpellDetails: { [id: number]: { id: string, key: string, name: string } };

export async function loadDdragon() {
    try {
        const versions = await fetch("https://ddragon.leagueoflegends.com/api/versions.json").then(x => x.json());
        ddragonVersion = versions[0];

        championDetails = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/champion.json`)
            .then(x => x.json())
            .then(map => {
            // map to { id: data }
            const details: any = {};
            Object.keys(map.data).forEach(x => details[+map.data[x].key] = map.data[x]);
            return details;
        });

        summonerSpellDetails = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/summoner.json`)
            .then(x => x.json())
            .then(map => {
                // map to { id: data }
                const details: any = {};
                Object.keys(map.data).forEach(x => details[+map.data[x].key] = map.data[x]);
                return details;
            });

        runeTrees = await fetch(`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/runesReforged.json`)
            .then(x => x.json());
    } catch {
        ddragonVersion = "9.14.1";
    }
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
    if (role === "UNSELECTED") return require("../assets/role-unselected.png");
    if (role === "TOP") return require("../assets/role-top.png");
    if (role === "JUNGLE") return require("../assets/role-jungle.png");
    if (role === "MIDDLE") return require("../assets/role-mid.png");
    if (role === "BOTTOM") return require("../assets/role-bot.png");
    if (role === "UTILITY") return require("../assets/role-support.png");
    if (role === "FILL") return require("../assets/role-fill.png");
    return "";
}

export function getMapBackground(mapId: number) {
    return ({
        [10]: require("../assets/bg-tt.jpg"),
        [11]: require("../assets/bg-sr.jpg"),
        [12]: require("../assets/bg-ha.jpg"),
    } as any)[mapId] || require("../assets/magic-background.jpg");
}

export const ROLES: Role[] = [{
    name: "Top",
    key: "TOP",
    image: require("../assets/role-top.png")
}, {
    name: "Jungle",
    key: "JUNGLE",
    image: require("../assets/role-jungle.png")
}, {
    name: "Mid",
    key: "MIDDLE",
    image: require("../assets/role-mid.png")
}, {
    name: "Bot",
    key: "BOTTOM",
    image: require("../assets/role-bot.png")
}, {
    name: "Support",
    key: "UTILITY",
    image: require("../assets/role-support.png")
}, {
    name: "Fill",
    key: "FILL",
    image: require("../assets/role-fill.png")
}];