import { observable } from "mobx";
import socket from "../utils/socket";

export interface InvitationSuggestion {
    summonerId: number;
    summonerName: string;
}

export class SuggestedPlayersStore {
    @observable
    suggestions: InvitationSuggestion[] = [];

    constructor() {
        socket.observe("/lol-suggested-players/v1/suggested-players", result => {
            this.suggestions = result.status == 200 ? result.content : [];
        });
    }
}

const instance = new SuggestedPlayersStore();
export default instance;