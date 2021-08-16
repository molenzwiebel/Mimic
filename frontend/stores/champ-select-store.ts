import { computed, observable } from "mobx";
import socket, { Result } from "../utils/socket";
import InterfaceStore from "./champ-select/interface";
import TimerStore from "./champ-select/timer";
import MembersStore from "./champ-select/members";
import PickingStore from "./champ-select/picking";
import SpellsStore from "./champ-select/spells";
import { getChampionSummary } from "../utils/assets";

export interface ChampSelectMember {
    assignedPosition: string | ""; // blind pick has no role
    playerType: string; // either PLAYER or BOT
    cellId: number;
    championId: number;
    championPickIntent: number;
    selectedSkinId: number;
    displayName: string;
    summonerId: number;
    spell1Id: number;
    spell2Id: number;
    team: number;

    // added manually
    isFriendly: boolean;
}

export interface ChampSelectAction {
    id: number;
    actorCellId: number;
    championId: number;
    completed: boolean;
    type: "ban" | "pick" | "ten_bans_reveal"; // might be more types, only these two are used in conventional queues
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

    timer: ChampSelectTimer;
    trades: {
        id: number;
        cellId: number;
        state: string; // this is an enum.
    };

    benchEnabled: boolean;
    benchChampionIds: number[];
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
    };
}

export interface RerollState {
    numberOfRolls: number;
    maxRolls: number;
}

const summonerNameCache = new Map<number, string>();

async function batchQuerySummonerNames(ids: number[]): Promise<string[]> {
    const toRequest = ids.filter(x => !summonerNameCache.has(x));
    for (const id of toRequest) {
        // TODO: use /lol-summoner/v2/summoner-names here? Some part doesn't seem to like this.
        const results = (await socket.request(`/lol-summoner/v1/summoners/${id}`)).content;
        summonerNameCache.set(results.summonerId, results.displayName);
    }

    return ids.map(x => summonerNameCache.get(x)!);
}

export class ChampSelectStore {
    @observable state: ChampSelectState | null = null;
    @observable gameflowState: GameflowState | null = null;
    @observable rerollState: RerollState = { numberOfRolls: 0, maxRolls: 2 };

    readonly interface = new InterfaceStore(this);
    readonly timer = new TimerStore(this);
    readonly members = new MembersStore(this);
    readonly picking = new PickingStore(this);
    readonly spells = new SpellsStore(this);

    constructor() {
        // Start observing champion select.
        socket.observe("/lol-champ-select/v1/session", this.handleChampSelectChange);

        // Keep track of reroll points for if we play ARAM.
        socket.observe("/lol-summoner/v1/current-summoner/rerollPoints", result => {
            this.rerollState = result.status === 200 ? result.content : { numberOfRolls: 0, maxRolls: 2 };
        });
    }

    /**
     * Handles a change to the champion select and updates the state appropriately.
     * Note: this cannot be an arrow function for various changes. See the lobby component for more info.
     */
    private handleChampSelectChange = async (result: Result) => {
        if (result.status !== 200) {
            this.state = null;
            return;
        }

        const newState: ChampSelectState = result.content;
        newState.localPlayer = newState.myTeam.filter(x => x.cellId === newState.localPlayerCellId)[0];

        // Find some names for the players on our team.
        // For bots, this is easy:
        for (const member of newState.myTeam) {
            if (member.playerType !== "BOT") continue;
            member.displayName = (getChampionSummary(member.championId) || { name: "Unknown" }).name + " Bot";
            member.isFriendly = true;
        }

        // For human members, request all of the summoner names at once.
        const humanMembers = newState.myTeam.filter(x => x.playerType !== "BOT");
        const humanNames = await batchQuerySummonerNames(humanMembers.map(x => x.summonerId));
        humanMembers.forEach((mem, i) => {
            mem.displayName = humanNames[i];
            mem.isFriendly = true;
        });

        // Give enemy summoners obfuscated names, if we don't know their names
        newState.theirTeam.forEach((mem, idx) => {
            mem.displayName = "Summoner " + (idx + 1);
            mem.isFriendly = false;
        });

        // If we weren't in champ select before, fetch some data.
        if (!this.state) {
            // Gameflow, which contains information about the map and gamemode we are queued up for.
            socket.request("/lol-gameflow/v1/session").then(x => {
                x.status === 200 && (this.gameflowState = <GameflowState>x.content);
            });
        }

        const oldAction = this.state ? this.getActions(this.state.localPlayer) : undefined;
        this.state = newState;

        const newAction = this.getActions(this.state.localPlayer);
        // If we didn't have an action and have one now, or if the actions differ in id, present the champion picker.
        if ((!oldAction && newAction) || (newAction && oldAction && oldAction.id !== newAction.id)) {
            this.interface.pickingChampion = true;
        }
    };

    /**
     * @returns the current turn happening, or null if no single turn is currently happening (pre and post picks)
     */
    @computed
    get currentTurn(): ChampSelectTurn | null {
        if (!this.state || this.state.timer.phase !== "BAN_PICK") return null;
        // Find the first set of actions that has at least one not completed.
        return this.state.actions.find(x => x.filter(y => !y.completed).length > 0) || null;
    }

    /**
     * @returns the next turn happening, or null if there is no next turn.
     */
    @computed
    get nextTurn(): ChampSelectTurn | null {
        if (!this.state || this.state.timer.phase !== "BAN_PICK") return null;
        return this.state.actions.filter(x => x.filter(y => !y.completed).length > 0)[1] || null;
    }

    /**
     * @returns the action in the current turn for the specified member, or null if the member can't do anything
     */
    getActions(member: ChampSelectMember, future = false): ChampSelectAction | null {
        const turn = future ? this.nextTurn : this.currentTurn;
        return turn ? turn.find(x => x.actorCellId === member.cellId) || null : null;
    }

    /**
     * @returns the member associated with the specified cellId
     */
    getMember(cellId: number): ChampSelectMember {
        if (!this.state) throw new Error("Shouldn't happen");
        return this.state.myTeam.find(x => x.cellId === cellId) || this.state.theirTeam.find(x => x.cellId === cellId)!;
    }

    /**
     * @returns whether the local summoner still needs to pick a champion or not
     */
    @computed
    get hasLockedChampion(): boolean {
        return (
            !!this.state && // A state exists.
            this.state.actions.filter(
                (
                    x // and we cannot find a pick turn in which
                ) =>
                    x.filter(
                        (
                            y // there exists an action...
                        ) =>
                            y.actorCellId === this.state!.localPlayerCellId && // by the current player
                            y.type === "pick" && // that has to pick a champion
                            !y.completed // and hasn't been completed yet
                    ).length > 0
            ).length === 0
        );
    }
}

const instance = new ChampSelectStore();
export default instance;
