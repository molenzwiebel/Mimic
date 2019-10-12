import { observable } from "mobx";
import socket from "../utils/socket";

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

export class QueueStore {
    @observable
    state: QueueState | null = null;

    constructor() {
        socket.observe("/lol-matchmaking/v1/search", result => {
            this.state = result.status == 200 ? result.content : null;
        });
    }

    public joinQueue() {
        socket.request("/lol-lobby/v2/lobby/matchmaking/search", "POST");
    }

    public leaveQueue() {
        socket.request("/lol-lobby/v2/lobby/matchmaking/search", "DELETE");
    }
}

const instance = new QueueStore();
export default instance;