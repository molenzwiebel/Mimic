import Root from "../root/root";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { default as ChampSelect, ChampSelectState, ChampSelectMember } from "./champ-select";
import { POSITION_NAMES } from "@/constants";

@Component
export default class Members extends Vue {
    $root: Root;
    $parent: ChampSelect;

    @Prop()
    state: ChampSelectState;

    /**
     * @returns the background champion splash image for the specified member.
     */
    getBackgroundStyle(member: ChampSelectMember): string {
        const act = this.$parent.getActions(member);
        const champId = (act ? act.championId : 0) || member.championId || member.championPickIntent;
        if (!champId) return "background-color: transparent;";

        const champ = this.$parent.championDetails[champId];
        if (!champ) return "background-color: transparent;";

        const fade = champId === member.championPickIntent ? "opacity: 0.6;" : "";

        // Show skins if everyone has picked.
        if (this.$parent.hasEveryonePicked) {
            return `background-image: url(https://cdn.communitydragon.org/latest/champion/${champ.key}/splash-art/centered/skin/${member.selectedSkinId % 1000}), url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_${member.selectedSkinId % 1000}.jpg); ${fade}`;
        }

        // Else just show the champs.
        return `background-image: url(https://cdn.communitydragon.org/latest/champion/${champ.key}/splash-art/centered), url(https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg); ${fade}`;
    }

    /**
     * @returns the active overlay animation class for the specified member.
     */
    getActiveOverlayClass(member: ChampSelectMember): string {
        if (!this.state) return "";
        if (this.state.timer.phase !== "BAN_PICK") return "";
        const act = this.$parent.getActions(member);
        if (!act || act.completed) return "";
        return act.type === "ban" ? "banning" : "picking";
    }

    /**
     * @returns the subtext for the specified member.
     */
    getMemberSubtext(member: ChampSelectMember): string {
        if (!this.state) return "";
        let extra = this.state.timer.phase === "PLANNING" && member === this.state.localPlayer ? "Declaring Intent" : "";

        const cur = this.$parent.getActions(member);
        if (cur && !cur.completed && !extra) {
            extra = cur.type === "ban" ? "Banning..." : "Picking...";
        }

        const next = this.$parent.getActions(member, true);
        if (next && !extra) {
            extra = next.type === "ban" ? "Banning Next..." : "Picking Next...";
        }

        if (!member.assignedPosition) return extra;
        return POSITION_NAMES[member.assignedPosition.toUpperCase()] + (extra ? " - " + extra : "");
    }

    /**
     * @returns the url to the icon for the specified summoner icon id
     */
    getSummonerSpellImage(id: number): string {
        if (!this.$parent.summonerSpellDetails[id]) return "";

        return `https://ddragon.leagueoflegends.com/cdn/${this.$root.ddragonVersion}/img/spell/${this.$parent.summonerSpellDetails[id].id}.png`;
    }
}
