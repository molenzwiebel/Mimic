let _ddragon: string | undefined;
export function ddragon() {
    if (_ddragon) return _ddragon;

    // Load ddragon async.
    const req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if (req.status !== 200 || !req.responseText || req.readyState !== 4) return;
        const Riot = { DDragon: { m: { dd: "" } } };
        _ddragon = Riot.DDragon.m.dd;
    };
    req.open("GET", "http://ddragon.leagueoflegends.com/realms/euw.js", true);
    req.send();

    // Return default until we've loaded.
    return "7.19.1";
}

export const QUEUES: { [key: number]: string } = {
    2: "Normal 5v5",
    8: "Normal 3v3",
    14: "Draft 5v5",
    31: "Coop vs AI - Intro",
    32: "Coop vs AI - Beginner",
    65: "ARAM 5v5",
    76: "URF 5v5",
    96: "Ascension 5v5",
    315: "Nexus Siege 5v5",
    300: "King Poro 5v5",
    318: "ARURF 5v5",
    400: "Draft 5v5",
    415: "Ranked 5v5",
    420: "Ranked Solo/Duo",
    440: "Ranked Flex"
};

export const MAPS: { [key: number]: string } = {
    8: "The Crystal Scar",
    10: "The Twisted Treeline",
    11: "Summoner's Rift",
    12: "The Howling Abyss"
};

export const POSITION_NAMES: { [key: string]: string } = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "Bottom",
    UTILITY: "Support",
    FILL: "Fill"
};

import RoleUnselected = require("./static/role-unselected.png");
import RoleTop = require("./static/role-top.png");
import RoleJungle = require("./static/role-jungle.png");
import RoleMid = require("./static/role-mid.png");
import RoleBot = require("./static/role-bot.png");
import RoleSupport = require("./static/role-support.png");
import RoleFill = require("./static/role-fill.png");

export type Role = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "FILL" | "UNSELECTED";

export function roleImage(role: Role) {
    if (role === "UNSELECTED") return RoleUnselected;
    if (role === "TOP") return RoleTop;
    if (role === "JUNGLE") return RoleJungle;
    if (role === "MIDDLE") return RoleMid;
    if (role === "BOTTOM") return RoleBot;
    if (role === "UTILITY") return RoleSupport;
    if (role === "FILL") return RoleFill;
    return "";
}

import HABackground = require("./static/bg-ha.jpg");
import TTBackground = require("./static/bg-tt.jpg");
import SRBackground = require("./static/bg-sr.jpg");
import MagicBackground = require("./static/magic-background.jpg");

export function mapBackground(mapId: number) {
    if (!mapId) return "";
    if (mapId === 10) return "background-image: url(" + TTBackground + ");";
    if (mapId === 11) return "background-image: url(" + SRBackground + ");";
    if (mapId === 12) return "background-image: url(" + HABackground + ");";
    return "background-image: url(" + MagicBackground + ");";
}