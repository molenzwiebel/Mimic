import Vue from "vue";
import Component from "vue-class-component";
import Root from "../root/root";

/**
 * Represents a game queue. These are shown based on availability and category.
 */
interface GameQueue {
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
@Component({ })
export default class CreateLobby extends Vue {
    $root: Root;

    enabledGameQueues: number[] = [];
    defaultGameQueues: number[] = [];
    queues: GameQueue[] = [];

    mounted() {
        // Observe enabled and default game queues.
        this.$root.observe("/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues", data => {
            this.enabledGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
        });

        // Observe enabled and default game queues.
        this.$root.observe("/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues", data => {
            this.defaultGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
        });

        // Update queue maps.
        this.$root.observe("/lol-game-queues/v1/queues", data => {
            this.queues = data.status === 200 ? data.content : [];
        });
    }

    /**
     * Sorts queues by mapId-gameMode, limited to only the queues that are actually
     * available. Also only recomputed if its dependencies change.
     */
    get availableQueues(): MappedQueueList {
        const ret: MappedQueueList = {};

        // Collect queues.
        for (const queue of this.queues) {
            if (queue.category !== "PvP") continue; // only render pvp queues
            if (queue.id !== 91 && (queue.queueAvailability !== "Available" || !this.enabledGameQueues.includes(queue.id))) continue;

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
    get sections(): string[] {
        return Object.keys(this.availableQueues).sort((a, b) => {
            const [aMap, aGameMode] = a.split("-");
            const [bMap, bGameMode] = b.split("-");

            // First: prefer classic over anything other.
            if (aGameMode === "CLASSIC" && bGameMode !== "CLASSIC") return -1;
            if (bGameMode === "CLASSIC") return 1;

            // Then, prefer ARAM over anything else.
            if (aGameMode === "ARAM" && bGameMode !== "ARAM") return -1;
            if (bGameMode === "ARAM") return 1;

            // Finally, prefer map 11 (rift) over anything else.
            if (aMap === "11" && bMap !== "11") return -1;
            if (bMap === "11") return 1;

            // Else, return 0.
            return 0;
        });
    }

    /**
     * @returns if the website is currently running in "standalone" mode (e.g. added to homescreen)
     */
    get isStandalone(): boolean {
        return !!((<any>navigator).standalone || window.matchMedia('(display-mode: standalone)').matches);
    }

    /**
     * @returns whether or not we can trigger a prompt for the user to add this application to their homescreen (android only)
     */
    get canTriggerHomescreenPrompt(): boolean {
        return !!((<any>window).installPrompt);
    }

    /**
     * Triggers the Android install prompt for the user to add the current app to their homescreen.
     */
    triggerInstallPrompt() {
        if (!this.canTriggerHomescreenPrompt) return;

        (<any>window).installPrompt.prompt();
    }
}