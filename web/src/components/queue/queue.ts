import Vue from "vue";
import Root, { Result } from "../root/root";
import { Component } from "vue-property-decorator";

// Note: this is not a complete definition of the queue state.
// It only contains properties we access in this component.
export interface QueueState {
    isCurrentlyInQueue: boolean;
    estimatedQueueTime: number;
    timeInQueue: number;
    searchState: string;
    errors: {
        errorType: string;
        penaltyTimeRemaining: number;
    }[];
}

@Component
export default class Queue extends Vue {
    $root: Root;

    state: QueueState | null = null;

    mounted() {
        // Start observing the queue.
        this.$root.observe("/lol-matchmaking/v1/search", this.handleMatchmakingChange.bind(this));
    }

    /**
     * Handles a change to the matchmaking search. Adds the appropriate class to the body element.
     * Note: this cannot be an arrow function for various changes. See the lobby component for more info.
     */
    handleMatchmakingChange = async function(this: Queue, result: Result) {
        if (result.status !== 200 || !result.content.isCurrentlyInQueue) {
            this.state = null;
            document.body.classList.remove("in-queue");
            return;
        }

        this.state = result.content;
        document.body.classList.add("in-queue");
    };

    /**
     * @returns if the queue component should currently show
     */
    get shouldShow(): boolean {
        return !!(this.state && this.state.isCurrentlyInQueue);
    }

    /**
     * Leaves the current matchmaking queue.
     */
    leaveQueue() {
        this.$root.request("/lol-matchmaking/v1/search", "DELETE");
    }

    /**
     * Formats the provided number of seconds into a XX:YY format.
     */
    formatSeconds(secs: number) {
        return (Math.floor(secs / 60)) + ":" + ("00" + (Math.round(secs) % 60).toFixed(0)).slice(-2);
    }
}