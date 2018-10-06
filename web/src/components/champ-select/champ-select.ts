import Vue from "vue";
import Root, { Result } from "../root/root";
import { Component } from "vue-property-decorator";
import { ddragon, mapBackground, Role } from "../../constants";

import Timer from "./timer.vue";
import Members from "./members.vue";
import PlayerSettings from "./player-settings.vue";
import SummonerPicker from "./summoner-picker.vue";
import ChampionPicker from "./champion-picker.vue";
import SkinPicker from "./skin-picker.vue";
import RuneEditor from "./rune-editor.vue";

import MagicBackground from "../../static/magic-background.jpg";

export interface ChampSelectMember {
    assignedPosition: Role | ""; // blind pick has no role
    cellId: number;
    championId: number;
    championPickIntent: number;
    selectedSkinId: number,
    displayName: string;
    summonerId: number;
    spell1Id: number;
    spell2Id: number;
    team: number;
}

export interface ChampSelectAction {
    id: number;
    actorCellId: number;
    championId: number;
    completed: boolean;
    type: "ban" | "pick"; // might be more types, only these two are used in conventional queues
}

// A 'turn' is simply an array of actions that happen at the same time.
// In blind pick, this is all the players picking. In draft pick, every
// turn only contains a single action (since no players pick at the same time).
export type ChampSelectTurn = ChampSelectAction[];

export interface ChampSelectTimer {
    phase: "PLANNING" | "BAN_PICK" | "FINALIZATION" | "GAME_STARTING"; // might be more
    isInfinite: boolean;
    adjustedTimeLeftInPhase: number; // time left in ms
}

export interface ChampSelectState {
    actions: ChampSelectTurn[];

    localPlayerCellId: number;
    localPlayer: ChampSelectMember; // added manually, not actually in the payload

    myTeam: ChampSelectMember[];
    theirTeam: ChampSelectMember[];

    bans: {
        myTeamBans: number[];
        theirTeamBans: number[];
        numBans: number;
    };

    timer: ChampSelectTimer;
    trades: {
        id: number;
        cellId: number;
        state: string; // this is an enum.
    }
}

export interface GameflowState {
    map: { id: number };
    gameData: {
        queue: {
            gameMode: string;
            gameTypeConfig: {
                reroll: boolean;
            };
        };
    }
}

export interface RerollState {
    numberOfRolls: number;
    maxRolls: number;
}

export interface RunePage {
    id: number;
    name: string;
    isEditable: boolean;
    isActive: boolean;
    order: number;
    primaryStyleId: number; // -1 if not selected
    subStyleId: number; // -1 if not selected
    selectedPerkIds: number[]; // 0 or not included if not selected
}

@Component({
    components: {
        timer: Timer,
        members: Members,
        playerSettings: PlayerSettings,
        summonerPicker: SummonerPicker,
        championPicker: ChampionPicker,
        skinPicker: SkinPicker,
        runeEditor: RuneEditor
    }
})
export default class ChampSelect extends Vue {
    $root: Root;

    state: ChampSelectState | null = null;
    gameflowState: GameflowState | null = null;
    rerollState: RerollState = { numberOfRolls: 0, maxRolls: 2 };

    runePages: RunePage[] = [];
    currentRunePage: RunePage | null = null;

    // Information on the current user.
    summoner: any = {};

    // These two are used to map summoner/champion id -> data.
    championDetails: { [id: number]: { id: string, key: string, name: string } };
    summonerSpellDetails: { [id: number]: { id: string, key: string, name: string } };

    // Information for the summoner spell overlay.
    pickingSummonerSpell = false;
    pickingFirstSummonerSpell = false;

    // Information for the skin picker.
    pickingSkin = false;
    locked = false;

    // Information for the champion picker.
    pickingChampion = false;

    // Information for the rune editor.
    showingRuneOverlay = false;

    mounted() {
        this.loadStatic("champion.json").then(map => {
            // map to { id: data }
            const details: any = {};
            Object.keys(map.data).forEach(x => details[+map.data[x].key] = map.data[x]);
            this.championDetails = details;
        });

        this.loadStatic("summoner.json").then(map => {
            // map to { id: data }
            const details: any = {};
            Object.keys(map.data).forEach(x => details[+map.data[x].key] = map.data[x]);
            this.summonerSpellDetails = details;
        });

        // Start observing champion select.
        this.$root.observe("/lol-champ-select/v1/session", this.handleChampSelectChange.bind(this));

        // Keep track of reroll points for if we play ARAM.
        this.$root.observe("/lol-summoner/v1/current-summoner/rerollPoints", result => {
            this.rerollState = result.status === 200 ? result.content : { numberOfRolls: 0, maxRolls: 2 };
        });

        // Get the current summoner info.
        this.$root.observe("/lol-summoner/v1/current-summoner", result => {
            this.summoner = result.status === 200 ? result.content : 0;
        });

        // Observe runes
        this.$root.observe("/lol-perks/v1/pages", response => {
            response.status === 200 && (this.runePages = response.content);
            response.status === 200 && (this.runePages.sort((a, b) => a.order - b.order));
        });

        this.$root.observe("/lol-perks/v1/currentpage", response => {
            this.currentRunePage = response.status === 200 ? response.content : null;

            // Update the isActive param if needed.
            if (this.currentRunePage) {
                this.runePages.forEach(x => x.isActive = x.id === this.currentRunePage!.id);
            }
        });
    }

    /**
     * Handles a change to the champion select and updates the state appropriately.
     * Note: this cannot be an arrow function for various changes. See the lobby component for more info.
     */
    handleChampSelectChange = async function (this: ChampSelect, result: Result) {
        if (result.status !== 200) {
            this.state = null;
            return;
        }

        const newState: ChampSelectState = result.content;
        newState.localPlayer = newState.myTeam.filter(x => x.cellId === newState.localPlayerCellId)[0];

        // For everyone on our team, request their summoner name.
        await Promise.all(newState.myTeam.map(async mem => {
            const summ = (await this.$root.request("/lol-summoner/v1/summoners/" + mem.summonerId)).content;
            mem.displayName = summ.displayName;
        }));

        // Give enemy summoners obfuscated names, if we don't know their names
        newState.theirTeam.forEach((mem, idx) => {
            mem.displayName = "Summoner " + (idx + 1);
        });

        // If we weren't in champ select before, fetch some data.
        if (!this.state) {
            // Gameflow, which contains information about the map and gamemode we are queued up for.
            this.$root.request("/lol-gameflow/v1/session").then(x => {
                x.status === 200 && (this.gameflowState = <GameflowState>x.content);
            });
        }

        const oldAction = this.state ? this.getActions(this.state.localPlayer) : undefined;
        this.state = newState;

        const newAction = this.getActions(this.state.localPlayer);
        // If we didn't have an action and have one now, or if the actions differ in id, present the champion picker.
        if ((!oldAction && newAction) || (newAction && oldAction && oldAction.id !== newAction.id)) {
            this.pickingChampion = true;
        }
    };

    /**
     * @returns the map background for the current queue
     */
    get background(): string {
        if (!this.gameflowState) return "background-image: url(" + MagicBackground + ")";
        return mapBackground(this.gameflowState.map.id);
    }

    // TODO: Maybe unify the following two functions?
    /**
     * @returns the current turn happening, or null if no single turn is currently happening (pre and post picks)
     */
    get currentTurn(): ChampSelectTurn | null {
        if (!this.state || this.state.timer.phase !== "BAN_PICK") return null;
        // Find the first set of actions that has at least one not completed.
        return this.state.actions.filter(x => x.filter(y => !y.completed).length > 0)[0];
    }

    /**
     * @returns the next turn happening, or null if there is no next turn.
     */
    get nextTurn(): ChampSelectTurn | null {
        if (!this.state || this.state.timer.phase !== "BAN_PICK") return null;
        return this.state.actions.filter(x => x.filter(y => !y.completed).length > 0)[1];
    }

    /**
     * @returns the action in the current turn for the specified member, or null if the member can't do anything
     */
    getActions(member: ChampSelectMember, future = false): ChampSelectAction | null {
        const turn = future ? this.nextTurn : this.currentTurn;
        return turn ? turn.filter(x => x.actorCellId === member.cellId)[0] || null : null;
    }

    /**
     * @returns the member associated with the specified cellId
     */
    getMember(cellId: number): ChampSelectMember {
        if (!this.state) throw new Error("Shouldn't happen");
        return this.state.myTeam.filter(x => x.cellId === cellId)[0] || this.state.theirTeam.filter(x => x.cellId === cellId)[0];
    }

    /**
     * Selects the specified rune page, by setting its `current` property to true and calling the collections backend.
     */
    selectRunePage(event: Event) {
        const id = +(event.target as HTMLSelectElement).value;
        this.runePages.forEach(r => r.isActive = r.id === id);
        this.$root.request("/lol-perks/v1/currentpage", "PUT", "" + id);
    }

    /**
     * Helper method to load the specified json name from the ddragon static data.
     */
    public loadStatic(filename: string): Promise<any> {
        return new Promise(resolve => {
            const req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.status !== 200 || !req.responseText || req.readyState !== 4) return;
                const map = JSON.parse(req.responseText);
                resolve(map);
            };
            req.open("GET", "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/data/en_US/" + filename, true);
            req.send();
        });
    }
}