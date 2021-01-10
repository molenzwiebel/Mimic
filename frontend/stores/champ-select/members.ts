import { computed } from "mobx";
import { ChampSelectMember, ChampSelectStore } from "../champ-select-store";
import { POSITION_NAMES } from "../../utils/constants";
import { getChampionSummary } from "../../utils/assets";

/**
 * Sub-store for champ select, responsible for handling the members
 * displayed in the list.
 */
export default class MembersStore {
    constructor(private store: ChampSelectStore) {}

    /**
     * Computes the proper background image for the specified member. Returns
     * an object that can be mixed into an ImageBackground.
     */
    getMemberBackground(member: ChampSelectMember): null | { championId: number; skinId: number; style: any } {
        const act = this.store.getActions(member);
        const champId = (act ? act.championId : 0) || member.championId || member.championPickIntent;
        if (!champId) return null;

        const champ = getChampionSummary(champId);
        if (!champ) return null;

        const fade = act && !act.completed;

        // Show skins if everyone has picked.
        if (this.hasEveryonePicked) {
            return {
                style: { opacity: fade ? 0.3 : 1 },
                championId: champ.id,
                skinId: member.selectedSkinId
            };
        }

        // Else just show the champs.
        return {
            style: { opacity: fade ? 0.3 : 1 },
            championId: champ.id,
            skinId: 0
        };
    }

    /**
     * Computes which animated flame background style should be shown for this member.
     */
    getMemberFlameStyle(member: ChampSelectMember): "" | "banning" | "picking" {
        if (!this.store.state) return "";
        if (this.store.state.timer.phase !== "BAN_PICK") return "";

        const act = this.store.getActions(member);
        if (!act || act.completed) return "";

        return act.type === "ban" ? "banning" : "picking";
    }

    /**
     * Computes the subtext shown below the name of a player.
     */
    getMemberSubtext(member: ChampSelectMember): string {
        if (!this.store.state) return "";
        let extra =
            this.store.state.timer.phase === "PLANNING" && member === this.store.state.localPlayer
                ? "Declaring Intent"
                : "";

        const cur = this.store.getActions(member);
        if (cur && !cur.completed && !extra) {
            extra = cur.type === "ban" ? "Banning..." : "Picking...";
        }

        const next = this.store.getActions(member, true);
        if (next && !extra) {
            extra = next.type === "ban" ? "Banning Next..." : "Picking Next...";
        }

        if (!member.assignedPosition) return extra;
        return POSITION_NAMES[member.assignedPosition.toUpperCase()] + (extra ? " - " + extra : "");
    }

    /**
     * @returns whether everyone has picked their champion already
     */
    @computed
    get hasEveryonePicked(): boolean {
        return (
            !!this.store.state && // A state exists.
            this.store.state.actions.filter(
                (
                    x // and we cannot find a pick turn in which
                ) =>
                    x.filter(
                        (
                            y // there exists an action...
                        ) => y.type === "pick" && !y.completed // that has to pick a champion // and hasn't been completed yet
                    ).length > 0
            ).length === 0
        );
    }
}
