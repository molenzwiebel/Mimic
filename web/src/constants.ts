let _ddragon: string | undefined;
export function ddragon() {
    if (_ddragon) return _ddragon;

    // Load ddragon async.
    const req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if (req.status !== 200 || !req.responseText || req.readyState !== 4) return;
        const versions: string[] = JSON.parse(req.responseText);
        _ddragon = versions[0]; // newest patch is first in the list
    };
    req.open("GET", "http://ddragon.leagueoflegends.com/api/versions.json", true);
    req.send();

    // Return default until we've loaded.
    return "8.24.1";
}

export const POSITION_NAMES: { [key: string]: string } = {
    TOP: "Top",
    JUNGLE: "Jungle",
    MIDDLE: "Mid",
    BOTTOM: "Bottom",
    UTILITY: "Support",
    FILL: "Fill",
    LANE: "Lane" // nexus blitz
};

import RoleUnselected from "./static/role-unselected.png";
import RoleTop from "./static/role-top.png";
import RoleJungle from "./static/role-jungle.png";
import RoleMid from "./static/role-mid.png";
import RoleBot from "./static/role-bot.png";
import RoleSupport from "./static/role-support.png";
import RoleFill from "./static/role-fill.png";

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

import HABackground from "./static/bg-ha.jpg";
import TTBackground from "./static/bg-tt.jpg";
import SRBackground from "./static/bg-sr.jpg";
import MagicBackground from "./static/magic-background.jpg";

export function mapBackground(mapId: number) {
    if (!mapId) return "";
    if (mapId === 10) return "background-image: url(" + TTBackground + ");";
    if (mapId === 11) return "background-image: url(" + SRBackground + ");";
    if (mapId === 12) return "background-image: url(" + HABackground + ");";
    return "background-image: url(" + MagicBackground + ");";
}