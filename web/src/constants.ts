let _ddragon: string | undefined;
export function ddragon() {
    if (_ddragon) return _ddragon;

    // Load ddragon async.
    const req = new XMLHttpRequest();
    req.open("GET", "https://ddragon.leagueoflegends.com/api/versions.json", true);
    req.send();
    req.onload = () => {
        if (req.status == 200)
            let version = JSON.parse(req.response); // OR: let version: string[] = JSON.parse(req.response);
            _ddragon = version[0]; // newest patch is first in the list
        else
            return "10.3.1";
    };
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

export const GAMEMODE_NAMES: { [key: string]: string } = {
    "8-ascension": "Ascension",
    "8-odin": "Definitely Not Dominion",
    "10-classic": "Twisted Treeline",
    "11-arsr": "ARSR",
    "11-assassinate": "Blood Moon",
    "11-classic": "Summoner’s Rift",
    "11-urf": "AR URF",
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

import RoleUnselected from "./static/roles/role-unselected.png";
import RoleTop from "./static/roles/role-top.png";
import RoleJungle from "./static/roles/role-jungle.png";
import RoleMid from "./static/roles/role-mid.png";
import RoleBot from "./static/roles/role-bot.png";
import RoleSupport from "./static/roles/role-support.png";
import RoleFill from "./static/roles/role-fill.png";

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

import HABackground from "./static/backgrounds/bg-ha.jpg";
import TTBackground from "./static/backgrounds/bg-tt.jpg";
import SRBackground from "./static/backgrounds/bg-sr.jpg";
import TFTBackground from "./static/backgrounds/bg-tft.jpg";
import MagicBackground from "./static/magic-background.jpg";

export function mapBackground(mapId: number) {
    if (!mapId) return "";
    if (mapId === 10) return "background-image: url(" + TTBackground + ");";
    if (mapId === 11) return "background-image: url(" + SRBackground + ");";
    if (mapId === 12) return "background-image: url(" + HABackground + ");";
    if (mapId === 22) return "background-image: url(" + TFTBackground + ");";
    return "background-image: url(" + MagicBackground + ");";
}
