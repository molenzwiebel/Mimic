import { computed, observable } from "mobx";
import socket from "../utils/socket";

/**
 * Represents a game queue. These are shown based on availability and category.
 */
export interface GameQueue {
    category: string;
    gameMode: string;
    description: string;
    id: number;
    queueAvailability: string;
    mapId: number;
}

type MappedQueueList = { [key: string]: GameQueue[] };

/**
 * Quick note: All the logic for displaying which queues where is ripped directly from
 * the League client. If the logic seems dodgy or spaghetti, you know who to blame. <3
 *
 * Note that we only show PVP modes. Adding in a tabbing system for the few people that
 * do bots is a bit excessive, especially considering the slow queue time. Maybe if people
 * show interest.
 */
export class LobbyCreationStore {
    @observable
    enabledGameQueues: number[] = [];

    @observable
    defaultGameQueues: number[] = [];

    @observable
    queues: GameQueue[] = [];

    @observable
    selectedSection = "";

    @observable
    selectedQueueId = 0;

    constructor() {
        // Helper function to return to the first queue of the first map if
        // the set of available queues changes. This is easier than diffing and
        // checking if the current queue is still available, and it is very
        // unlikely that queues will change while the user is active anyway.
        const resetCurrentSelection = () => {
            if (!this.sections.length) {
                this.selectedSection = "";
                this.selectedQueueId = 0;
                return;
            }

            // Queues changed, update
            this.selectedSection = this.sections[0];
            this.selectedQueueId = this.availableQueues[this.selectedSection][0].id;
        };

        // Observe enabled and default game queues.
        socket.observe("/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues", data => {
            this.enabledGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
            resetCurrentSelection();
        });

        // Observe enabled and default game queues.
        socket.observe("/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues", data => {
            this.defaultGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
            resetCurrentSelection();
        });

        // Update queue maps.
        socket.observe("/lol-game-queues/v1/queues", data => {
            this.queues = data.status === 200 ? data.content : [];
            resetCurrentSelection();
        });
    }

    /**
     * Sorts queues by mapId-gameMode, limited to only the queues that are actually
     * available. Also only recomputed if its dependencies change.
     */
    @computed
    get availableQueues(): MappedQueueList {
        const ret: MappedQueueList = {};

        // Collect queues.
        for (const queue of this.queues) {
            if (queue.category !== "PvP") continue; // only render pvp queues
            if (queue.queueAvailability !== "Available" || !this.enabledGameQueues.includes(queue.id)) continue;

            const key = queue.mapId + "-" + queue.gameMode;
            if (!ret[key]) ret[key] = [];

            ret[key].push(queue);
        }

        // Sort queues on whether they appear in the defaults list, and if yes where.
        for (const queues of Object.values(ret)) {
            queues.sort((a, b) => {
                const aDefaultIndex = this.defaultGameQueues.indexOf(a.id);
                const bDefaultIndex = this.defaultGameQueues.indexOf(b.id);

                if (aDefaultIndex !== -1) {
                    if (bDefaultIndex !== -1) {
                        // Both are in the defaults, return the one that appears earlier.
                        return aDefaultIndex - bDefaultIndex;
                    }

                    // Only a appears in the defaults, so it should go first.
                    return -1;
                }

                // Only b appears in the deffaults, so it should go first.
                if (bDefaultIndex !== -1) {
                    return 1;
                }

                // Neither are in the defaults, we don't care about the order.
                return 0;
            });
        }

        return ret;
    }

    /**
     * Sorts the available sections (mapId-gamemode) by the order in which they should
     * appear on the screen.
     */
    @computed
    get sections(): string[] {
        return Object.keys(this.availableQueues).sort((a, b) => {
            const [aMap, aGameMode] = a.split("-");
            const [bMap, bGameMode] = b.split("-");

            // First, prefer map 11 (rift) over anything else.
            if (aMap === "11" && bMap !== "11") return -1;
            if (bMap === "11") return 1;

            // Then, prefer classic over anything other.
            if (aGameMode === "CLASSIC" && bGameMode !== "CLASSIC") return -1;
            if (bGameMode === "CLASSIC") return 1;

            // Finally, prefer ARAM over anything else.
            if (aGameMode === "ARAM" && bGameMode !== "ARAM") return -1;
            if (bGameMode === "ARAM") return 1;

            // Else, return 0.
            return 0;
        });
    }

    /**
     * Selects the specified section, setting the current queue to
     * the first option within the specified section.
     */
    selectSection(section: string) {
        this.selectedSection = section;
        this.selectedQueueId = this.availableQueues[section][0].id;
    }

    /**
     * Selects the specified queue. It is assumed the selected section is correct.
     */
    selectQueue(queue: GameQueue) {
        this.selectedQueueId = queue.id;
    }

    /**
     * Creates a lobby with the currently chosen queue.
     */
    createLobby() {
        socket.request("/lol-lobby/v2/lobby", "POST", JSON.stringify({
            queueId: this.selectedQueueId
        }));
    }
}

const instance = new LobbyCreationStore();
(<any>window).store = instance;
export default instance;