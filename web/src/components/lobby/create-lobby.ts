import Vue from "vue";
import Component from "vue-class-component";
import Root from "../root/root";
import { GAMEMODE_NAMES } from "@/constants";

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

    iconPaths: { [key: string]: string } = {};
    enabledGameQueues: number[] = [];
    defaultGameQueues: number[] = [];
    queues: GameQueue[] = [];

    selectedSection = "";
    selectedQueueId = 0;

    created() {
        // Prepare icon paths.
        // Note that even though promises are used, these all resolve synchronously.
        for (const map of ["sr", "ha", "tt", "rgm"]) {
            import(/* webpackMode: "eager" */ `../../static/maps/${map}-default.png`).then(result => {
                this.iconPaths[map + "-default"] = result.default;
            });

            import(/* webpackMode: "eager" */ `../../static/maps/${map}-active.png`).then(result => {
                this.iconPaths[map + "-active"] = result.default;
            });
        }
    }

    mounted() {
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
        this.$root.observe("/lol-platform-config/v1/namespaces/LcuSocial/EnabledGameQueues", data => {
            this.enabledGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
            resetCurrentSelection();
        });

        // Observe enabled and default game queues.
        this.$root.observe("/lol-platform-config/v1/namespaces/LcuSocial/DefaultGameQueues", data => {
            this.defaultGameQueues = data.status === 200 ? data.content.split(",").map((x: string) => +x) : [];
            resetCurrentSelection();
        });

        // Update queue maps.
        this.$root.observe("/lol-game-queues/v1/queues", data => {
            this.queues = data.status === 200 ? data.content : [];
            resetCurrentSelection();
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
     * Selects the specified section, setting the current queue to
     * the first option within the specified section.
     */
    selectSection(section: string) {
        this.selectedSection = section;
        this.selectedQueueId = this.availableQueues[section][0].id;
    }

    /**
     * @returns the url to the map icon for the specified section
     */
    sectionIcon(section: string, extra: string) {
        const mapName = (<any>{
            "10-CLASSIC": "tt",
            "11-CLASSIC": "sr",
            "12-ARAM": "ha",
        })[section] || "rgm";

        return this.iconPaths[mapName + "-" + extra];
    }

    /**
     * Creates a lobby with the currently chosen queue.
     */
    createLobby() {
        this.$root.request("/lol-lobby/v2/lobby", "POST", JSON.stringify({
            queueId: this.selectedQueueId
        }));
    }

    /**
     * @returns the gamemode name for the currently selected section
     */
    get sectionTitle() {
        return GAMEMODE_NAMES[this.selectedSection.toLowerCase()] || "Rotating Game Mode";
    }
}