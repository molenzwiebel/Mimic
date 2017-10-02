import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { default as ChampSelect, ChampSelectState, ChampSelectMember } from "./champ-select";
import { ddragon, POSITION_NAMES } from "../../constants";

@Component
export default class Members extends Vue {
    $parent: ChampSelect;

    @Prop
    state: ChampSelectState;

    /**
     * @returns the background champion splash image for the specified member.
     */
    getBackgroundStyle(member: ChampSelectMember): string {
        const act = this.$parent.getActions(member);
        const champId = (act ? act.championId : 0) || member.championId || member.championPickIntent;
        if (!champId) return "background-color: transparent;";
        const champ = this.$parent.championDetails[champId];
        const fade = champId === member.championPickIntent ? "opacity: 0.6;" : "";
        return "background-image: url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash//" + champ.id + "_0.jpg);" + fade;
    }

    /**
     * @returns the active overlay animation class for the specified member.
     */
    getActiveOverlayClass(member: ChampSelectMember): string {
        if (!this.state) return "";
        if (this.state.timer.phase !== "BAN_PICK") return "";
        const act = this.$parent.getActions(member);
        if (!act) return "";
        return act.type === "ban" ? "banning" : "picking";
    }

    /**
     * @returns the subtext for the specified member.
     */
    getMemberSubtext(member: ChampSelectMember): string {
        if (!this.state) return "";
        let extra = this.state.timer.phase === "PLANNING" && member === this.state.localPlayer ? "Declaring Intent" : "";

        const cur = this.$parent.getActions(member);
        if (cur && !extra) {
            extra = cur.type === "ban" ? "Banning..." : "Picking...";
        }

        const next = this.$parent.getActions(member, true);
        if (next && !extra) {
            extra = next.type === "ban" ? "Banning Next..." : "Picking Next...";
        }

        if (!member.assignedPosition) return extra;
        return POSITION_NAMES[member.assignedPosition] + (extra ? " - " + extra : "");
    }

    /**
     * @returns the url to the icon for the specified summoner icon id
     */
    getSummonerSpellImage(id: number): string {
        return "http://ddragon.leagueoflegends.com/cdn/" + ddragon() + "/img/spell/" + this.$parent.summonerSpellDetails[id].id + ".png";
    }
}