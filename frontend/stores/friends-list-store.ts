import { computed, observable } from "mobx";
import socket from "../utils/socket";

/**
 * Represents the open lobby metadata in a chat presence.
 */
export interface Party {
    partyId: string;
    queueId: number;
    summoners: number[];
}

/**
 * Represents a friend on the friends list.
 */
export interface Friend {
    availability: string;
    name: string;
    icon: number;
    lol?: {
        pty?: string
    };
}

/**
 * Represents game queue metadata as retrieved from /lol-game-queues/v1/queues.
 */
export interface GameQueue {
    id: number;
    shortName: string;
    maximumParticipantListSize: number;
}

export class FriendsListStore {
    @observable
    friends: Friend[] = [];

    @observable
    queues: GameQueue[] = [];

    constructor() {
        socket.observe("/lol-chat/v1/friends", result => {
            this.friends = result.status === 200 ? result.content || [] : [];
        });

        socket.observe("/lol-game-queues/v1/queues", result => {
            this.queues = result.status === 200 ? result.content || [] : [];
        });
    }

    /**
     * Joins the open lobby of the specified friend. Does nothing if the specified
     * user does not have an open lobby at the moment.
     */
    joinFriend(friend: Friend) {
        try {
            const party: Party = JSON.parse(friend.lol!.pty!);
            socket.request(`/lol-lobby/v2/party/${party.partyId}/join`, "POST");
        } catch {
            // Ignored
        }
    }

    /**
     * @returns the list of friends that are online and have an open lobby with space
     */
    @computed
    get friendsWithParties() {
        return this.friends.filter(x => {
            if (!x.lol || !x.lol.pty) return false;

            try {
                const party: Party = JSON.parse(x.lol.pty);
                if (!party.partyId) return false;

                // If queues aren't loaded, assume it's not full yet.
                if (!this.queues.length) return true;

                const queue = this.queues.find(x => x.id === party.queueId);
                if (!queue) return false;

                return party.summoners.length < queue.maximumParticipantListSize;
            } catch {}

            return false;
        });
    }
}

const instance = new FriendsListStore();
export default instance;