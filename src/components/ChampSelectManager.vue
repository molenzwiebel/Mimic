<template>
    <div class="champ-select" v-if="isInChampSelect" :style="background">
        <div class="timer-state">
            <span class="state">{{ stateTitle }}</span>
            <div class="timer-bans">
                <div class="bans bans-mine">
                    <template v-for="i in [0, 1, 2]">
                        <img v-if="state.bans.myTeamBans[i]" :src="championImage(state.bans.myTeamBans[i])">
                        <div v-else="" class="ban-placeholder"></div>
                    </template>
                </div>

                <span class="time">{{ Math.ceil(currentTimer / 1000) }}</span>

                <div class="bans bans-enemy">
                    <template v-for="i in [0, 1, 2]">
                        <img v-if="state.bans.theirTeamBans[i]" :src="championImage(state.bans.theirTeamBans[i])">
                        <div v-else="" class="ban-placeholder"></div>
                    </template>
                </div>
            </div>
        </div>

        <div class="scrollable-content">
            <div class="team">
                <span class="team-name">Your Team</span>
                <div class="team-member my" v-for="member in state.myTeam">
                    <div class="member-background" :style="backgroundStyle(member)"></div>
                    <div class="active-background" :class="memberActiveStyle(member)"></div>
                    <div class="summoner-spells">
                        <img :src="spellImage(member.spell1Id)">
                        <img :src="spellImage(member.spell2Id)">
                    </div>
                    <div class="info">
                        <span class="name">{{ member.displayName }}</span>
                        <span class="state">{{ memberSubtext(member) }}</span>
                    </div>
                </div>
            </div>

            <div class="team enemy-team">
                <span class="team-name">Enemy Team</span>
                <div class="team-member enemy" v-for="member, i in state.theirTeam">
                    <div class="member-background" :style="backgroundStyle(member)"></div>
                    <div class="active-background" :class="memberActiveStyle(member)"></div>
                    <div class="info">
                        <span class="name">{{ member.displayName || "Summoner " + (i + 1) }}</span>
                        <span class="state">{{ memberSubtext(member) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="player-settings">
            <div class="rune-mastery">
                <select @change="selectRunePage($event)">
                    <option :value="rune.id" :selected="rune.current" v-for="rune in runes">{{ rune.name }}</option>
                </select>

                <select @change="selectMasteryPage($event)">
                    <option :value="mastery.id" :selected="mastery.current" v-for="mastery in masteries">{{ mastery.name }}</option>
                </select>
            </div>

            <div class="summoners">
                <img :src="spellImage(localMember.spell1Id)" @click="(selectingSummonerSpell = true, selectingFirstSummoner = true)">
                <img :src="spellImage(localMember.spell2Id)" @click="(selectingSummonerSpell = true, selectingFirstSummoner = false)">
            </div>
        </div>

        <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
            <div class="overlay spell-selector" v-show="selectingSummonerSpell">
                <i class="ion-android-close close" @click="selectingSummonerSpell = false"></i>
                <div class="header">Select {{ selectingFirstSummoner ? 'First' : 'Second' }} Summoner</div>

                <div class="overlay-content">
                    <div class="summoner" v-for="summoner in availableSummoners" @click="selectSummoner(summoner.id)">
                        <img :src="spellImage(summoner.id)">
                        <div class="spell-info">
                            <span class="name">{{ summoner.name }}</span>
                            <span class="description">{{ summoner.description }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <transition enter-active-class="fadeInUp" leave-active-class="fadeOutDown">
            <div class="overlay champ-selector" v-show="showChampionPicker && canSelectChampion">
                <i class="ion-android-close close" @click="showChampionPicker = false"></i>
                <div class="header">{{ isCurrentlyBanning ? "Ban A Champion" : "Pick A Champion" }}</div>

                <div class="overlay-content">
                    <img @click="selectChampion(champId)" :class="selectedChampId === champId && 'selected'" v-for="champId in pickableChampIds" :src="championImage(champId)">
                </div>

                <button @click="completeAction()" :disabled="!canCompleteAction" class="champ-selector-confirm-button" :class="isCurrentlyBanning && 'ban'">
                    <div class="button-border"></div>
                    {{ isCurrentlyBanning ? "Ban" : "Lock In" }}
                </button>
            </div>
        </transition>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { DDRAGON_VERSION, POSITION_NAMES, mapBackground } from "../constants";

    interface ChampSelectMember {
        assignedPosition: "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | ""; // empty for enemy or blind pick.
        cellId: number;
        championId: number;
        championPickIntent: number;
        displayName: string;
        spell1Id: number;
        spell2Id: number;
    }

    interface ChampSelectState {
        actions: {
            actorCellId: number; // player that does this action.
            championId: number; // champion that was the result of this action (banned/picked champ). if completed = false, this is what the user is hovering.
            completed: boolean; // if this step is finished.
            id: number;
            type: "ban" | "pick"; // unsure if there are more types
        }[][];

        bans: {
            numBans: number;
            myTeamBans: number[];
            theirTeamBans: number[];
        };

        localPlayerCellId: number;

        myTeam: ChampSelectMember[];
        theirTeam: ChampSelectMember[];

        timer: {
            phase: "PLANNING" | "BAN_PICK" | "FINALIZATION" | "GAME_STARTING"; // unsure if there are more types
            isInfinite: boolean; // here for testing, true in battle training champ select
            adjustedTimeLeftInPhase: number;
        };

        trades: {
            // TODO: Figure out how this works.
            cellId: number;
            id: number;
            state: string;
        }[];
    }

    interface GameflowState {
        map: { id: number };
        gameData: {
            queue: { gameMode: string };
        }
    }

    @Component
    export default class ChampSelectManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        isInChampSelect = false;
        state: ChampSelectState = <ChampSelectState><any>null;
        gameflow: GameflowState = <GameflowState><any>null;

        champions: { id: string, key: string, name: string }[];
        summoners: { id: string, key: string, name: string }[];
        summonerQueues: { id: number, gameModes: string[] }[] = [];
        availableChamps: number[] = [];

        localSummonerId = 0;
        masteries: { current: boolean, name: string, id: number }[] = [];
        runes: { current: boolean, name: string, id: number }[] = [];

        currentTimer = 0;
        countdownId = -1;

        selectingSummonerSpell = false;
        selectingFirstSummoner = false;

        showChampionPicker = true;
        selectedChampId = -1;

        mounted() {
            const req = new XMLHttpRequest();
            this.loadStatic("champion.json", map => {
                this.champions = Object.keys(map.data).map(x => map.data[x]);
            });

            this.loadStatic("summoner.json", map => {
                this.summoners = Object.keys(map.data).map(x => map.data[x]);
            });

            // Observe summonerId, we need it for the runes and masteries.
            this.$root.observe("/lol-login/v1/session", (status, content) => {
                if (status === 200) this.localSummonerId = content.summonerId;
            });

            this.$root.observe("/lol-champ-select/v1/pickable-champions", (status, content) => {
                this.availableChamps = status === 200 ? content.championIds : this.availableChamps;
                this.availableChamps.sort((a, b) => this.championForId(a).name.localeCompare(this.championForId(b).name));
            });

            this.$root.observe("/lol-champ-select/v1/session", async (status, data) => {
                if (status !== 200) {
                    //this.isInChampSelect = false;
                    if (this.countdownId != -1) clearInterval(this.countdownId);

                    // Stop observing runes and masteries.
                    this.$root.unobserve("/lol-collections/v1/inventories/" + this.localSummonerId + "/mastery-book");
                    this.$root.unobserve("/lol-collections/v1/inventories/" + this.localSummonerId + "/rune-book");

                    return;
                }

                const oldAction = this.state ? this.actionForMember(this.localMember) : undefined;
                this.state = <ChampSelectState> data;
                const newAction = this.actionForMember(this.localMember);
                if ((!oldAction && newAction) || (newAction && oldAction && oldAction.id !== newAction.id)) {
                    this.showChampionPicker = true;
                }


                // If we weren't in champ select before.
                if (!this.isInChampSelect) {
                    this.isInChampSelect = true;

                    // Load gameflow (queue map and gamemode).
                    this.$root.request("/lol-gameflow/v1/session").then(x => {
                        x.status === 200 && (this.gameflow = <GameflowState>x.content);
                    });

                    this.$root.request("/lol-game-data/assets/v1/summoner-spells.json").then(x => {
                        x.status === 200 && (this.summonerQueues = x.content);
                    });

                    // Observe runes and masteries.
                    this.$root.observe("/lol-collections/v1/inventories/" + this.localSummonerId + "/mastery-book", (status, content) => {
                        status === 200 && (this.masteries = content.pages);
                    });

                    this.$root.observe("/lol-collections/v1/inventories/" + this.localSummonerId + "/rune-book", (status, content) => {
                        status === 200 && (this.runes = content.pages);
                    });
                }

                // Update timer.
                this.currentTimer = this.state.timer.adjustedTimeLeftInPhase;
                if (this.countdownId != -1) clearInterval(this.countdownId);

                // Unlike the queue, the champ select does not constantly send timer updates.
                if (!this.state.timer.isInfinite) {
                    this.countdownId = setInterval(() => {
                        this.currentTimer -= 200;
                        if (this.currentTimer < 0) this.currentTimer = 0;
                    }, 200);
                }
            });
        }

        loadStatic(filename: string, handler: (data: any) => void) {
            const req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.status !== 200 || !req.responseText || req.readyState !== 4) return;
                const map = JSON.parse(req.responseText);
                handler(map);
            };
            req.open("GET", "http://ddragon.leagueoflegends.com/cdn/" + DDRAGON_VERSION + "/data/en_GB/" + filename, true);
            req.send();
        }

        destroyed() {
            this.$root.unobserve("/lol-champ-select/v1/session");
        }

        get background() {
            if (!this.gameflow) return "background-image: url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)";
            return mapBackground(this.gameflow.map.id);
        }

        get stateTitle() {
            if (!this.state) return;

            if (this.state.timer.phase === "PLANNING") return "Declare your champion!";
            if (this.state.timer.phase === "FINALIZATION") return "Choose your loadout!";
            if (this.state.timer.phase === "GAME_STARTING") return "Game is starting!";

            const curAct = this.currentActions;
            if (!curAct || curAct.length === 0) return;

            // Only a single person is picking.
            if (curAct.length === 1) {
                const member = this.memberForCell(curAct[0].actorCellId);
                const name = member.displayName || "Summoner " + (member.cellId + 1);
                return name + " is " + (curAct[0].type === "ban" ? "banning..." : "picking...");
            }

            return curAct.length + " people are " + (curAct[0].type === "ban" ? "banning..." : "picking...");
        }

        get availableSummoners() {
            const gm = this.gameflow ? this.gameflow.gameData.queue.gameMode : "CLASSIC";
            return this.summonerQueues.filter(x => {
                return x.gameModes.indexOf(gm) !== -1
            });
        }

        get pickableChampIds() {
            if (!this.state) return [];
            return this.availableChamps.filter(x => this.state.bans.myTeamBans.indexOf(x) === -1 && this.state.bans.theirTeamBans.indexOf(x) === -1);
        }

        selectSummoner(id: number) {
            let first = this.localMember.spell1Id;
            let second = this.localMember.spell2Id;
            if (this.selectingFirstSummoner && id === second) {
                second = first;
                first = id;
            } else if (id === first) {
                first = second;
                second = id;
            } else {
                if (this.selectingFirstSummoner) first = id;
                else second = id;
            }

            this.$root.request("/lol-champ-select/v1/session/my-selection", "PATCH", JSON.stringify({ spell1Id: first, spell2Id: second })).then(x => console.dir(x));
            this.selectingSummonerSpell = false;
        }

        selectRunePage(event: any) {
            const id = +event.target.value;
            this.runes.forEach(r => r.current = r.id === id);
            this.$root.request("/lol-collections/v1/inventories/" + this.localSummonerId + "/rune-book", "PUT", JSON.stringify({ pages: this.runes }));
        }

        selectMasteryPage(event: any) {
            const id = +event.target.value;
            this.masteries.forEach(r => r.current = r.id === id);
            this.$root.request("/lol-collections/v1/inventories/" + this.localSummonerId + "/mastery-book", "PUT", JSON.stringify({ pages: this.masteries }));
        }

        memberActiveStyle(member: ChampSelectMember) {
            if (this.state.timer.phase !== "BAN_PICK") return "";
            const act = this.actionForMember(member);
            if (!act) return;
            return act.type === "ban" ? "banning" : "picking";
        }

        backgroundStyle(member: ChampSelectMember) {
            const act = this.actionForMember(member);
            const champId = (act ? act.championId : 0) || member.championId || member.championPickIntent;
            if (!champId) return "background-color: transparent;";
            const champ = this.championForId(champId);
            const fade = champId === member.championPickIntent ? "opacity: 0.6;" : "";
            return "background-image: url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash//" + champ.id + "_0.jpg);" + fade;
        }

        championForId(id: number) {
            if (id === 0) return { name: "", id: "" };
            return this.champions.filter(x => x.key === "" + id)[0];
        }

        spellImage(id: number) {
            return "http://ddragon.leagueoflegends.com/cdn/" + DDRAGON_VERSION + "/img/spell/" + this.summoners.filter(x => x.key === "" + id)[0].id + ".png";
        }

        championImage(id: number) {
            return "http://ddragon.leagueoflegends.com/cdn/" + DDRAGON_VERSION + "/img/champion/" + this.champions.filter(x => x.key === "" + id)[0].id + ".png";
        }

        memberSubtext(member: ChampSelectMember) {
            let extra = this.state.timer.phase === "PLANNING" && member.cellId === this.state.localPlayerCellId ? "Declaring Intent" : "";

            const cur = this.actionForMember(member);
            if (cur && !extra) {
                extra = cur.type === "ban" ? "Banning..." : "Picking...";
            }

            const next = this.actionForMember(member, true);
            if (next && !extra) {
                extra = next.type === "ban" ? "Banning Next..." : "Picking Next...";
            }

            if (!member.assignedPosition) return extra;
            return POSITION_NAMES[member.assignedPosition] + (extra ? " - " + extra : "");
        }

        get currentActions() {
            return this.state.actions.filter(x => x.filter(y => !y.completed).length > 0)[0];
        }

        get nextActions() {
            return this.state.actions.filter(x => x.filter(y => !y.completed).length > 0)[1];
        }

        memberForCell(cellId: number) {
            return this.state.myTeam.filter(x => x.cellId === cellId)[0] || this.state.theirTeam.filter(x => x.cellId === cellId)[0];
        }

        get canCompleteAction() {
            const act = this.actionForMember(this.localMember);
            return act && !act.completed;
        }

        completeAction() {
            this.showChampionPicker = false;
            const act = this.actionForMember(this.localMember)!!;
            this.$root.request("/lol-champ-select/v1/session/actions/" + act.id + "/complete", "POST");
        }

        selectChampion(champId: number) {
            const act = this.actionForMember(this.localMember)!!;
            this.selectedChampId = champId;
            this.$root.request("/lol-champ-select/v1/session/actions/" + act.id, "PATCH", JSON.stringify({ championId: this.selectedChampId }));
        }

        actionForMember(member: ChampSelectMember, next: boolean = false) {
            const curActs = next ? this.nextActions : this.currentActions;
            if (!curActs) return;

            return curActs.filter(x => x.actorCellId === member.cellId)[0];
        }

        get localMember() {
            return this.memberForCell(this.state.localPlayerCellId);
        }

        get isCurrentlyBanning() {
            const act = this.actionForMember(this.localMember);
            return act && act.type === "ban";
        }

        get canSelectChampion() {
            return this.state.timer.phase === "PLANNING" || this.state.timer.phase === "BAN_PICK";
        }
    }
</script>

<style lang="stylus" scoped>
    timer-status-height = 140px
    player-dropdown-height = 80px
    player-settings-height = player-dropdown-height * 2 + 4 * 5px + 2 * 10px
    team-member-height = 160px

    .champ-select
        z-index 10000
        position absolute
        top 0
        left 0
        bottom 0
        right 0
        background-size cover
        background-repeat no-repeat

    .scrollable-content
        // String interpolation is needed because variables are ignored in calc.
        max-height "calc(100% - %s)" % (timer-status-height + player-settings-height)
        overflow-y scroll
        -webkit-overflow-scrolling touch // smooth scrolling on ios

    .player-settings
        box-sizing border-box
        border-top 1px solid rgba(240, 230, 210, 0.5)
        background-color rgba(0, 0, 0, 0.5)
        height player-settings-height
        display flex
        align-items center
        padding 10px

        .rune-mastery
            flex 1
            display flex
            flex-direction column

            select
                box-sizing border-box
                -webkit-appearance none
                font-family "LoL Body"
                color #a09b8c
                font-size 35px
                height player-dropdown-height
                width 100%
                margin 5px
                padding 7px 15px
                border-width 2px
                border-style solid
                border-image linear-gradient(to top,#695625 0%,#a9852d 23%,#b88d35 93%,#c8aa6e 100%) 1
                background url(../static/dropdown_arrows.png) no-repeat right rgb(30, 35, 40)
                background-size auto player-dropdown-height - 30px
                background-position right 10px center

        .summoners
            display flex
            align-items center
            padding 10px

            img
                margin 20px
                border 1px solid #3c3c41
                height player-dropdown-height * 1.8
                width player-dropdown-height * 1.8

    .timer-state
        box-sizing border-box
        height timer-status-height
        display flex
        flex-direction column
        justify-content center
        align-items center
        border-bottom 1px solid rgba(240, 230, 210, 0.5)

        .state
            font-family "LoL Body"
            font-size 40px
            color white

    .bans
        display flex
        margin 0 20px

        img, .ban-placeholder
            box-sizing border-box
            width 60px
            height 60px
            margin 5px

        .ban-placeholder
            border 0.5px solid black
            background radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, black 100%)

    .timer-bans
        width 100%
        display flex
        flex-direction row
        justify-content space-between
        align-items center

        .time
            font-size 60px
            color #f0e6d2
            letter-spacing 0.05em
            font-family "LoL Display Bold"

    .team
        display flex
        flex-direction column
        padding-top 20px

    .team-name
        padding 5px 20px
        height 50px
        font-size 40px
        color #f0e6d2
        letter-spacing 0.05em
        font-family "LoL Display Bold"
        text-transform uppercase

    .team-member
        height team-member-height
        box-sizing border-box
        border-bottom 1px solid #cdbe93
        position relative
        display flex
        align-items center
        color white

        &:first-of-type
            border-top 1px solid #cdbe93

    .summoner-spells
        margin 10px 20px
        display flex
        flex-direction column
        align-items center
        justify-content space-around

        img
            width 60px
            height 60px

    .info
        display flex
        flex-direction column
        font-family "LoL Body"

        .name
            font-size 45px

        .state
            display inline-block
            height 30px
            transition 0.3s ease
            font-size 30px
            color #fffaef

        .state:empty
            height 0

    .enemy .info
        margin-left 20px

    .member-background
        position absolute
        z-index -1
        left 0
        top 0
        bottom 0
        right 0
        background-repeat no-repeat
        background-position 0 -80px
        background-size cover
        transition 0.3s ease

        &:after
            content ""
            position absolute
            left 0
            top 0
            bottom 0
            right 0
            background-image linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%)

    @keyframes champ-select-active-background
        0% { background-position: 100% 0; }
        50% { background-position: 0 100%; }
        100% { background-position: 100% 0; }
    .active-background
        transition 0.3s ease
        position absolute
        z-index -1
        left 0
        top 0
        bottom 0
        right 0
        opacity 0
        animation champ-select-active-background 5s ease infinite

        &.picking
            opacity 1
            background linear-gradient(186deg, alpha(#197e99, 0.5), alpha(#134b6d, 0.3), alpha(#197e99, 0.6), alpha(#1e465d, 0.4))
            background-size 400% 400%

        &.banning
            opacity 1
            background linear-gradient(186deg, alpha(#c6403b, 0.4), alpha(#f9413f, 0.2), alpha(#ec3930, 0.5), alpha(#ee241d, 0.3))
            background-size 400% 400%

    .overlay
        position absolute
        top timer-status-height
        left 0
        right 0
        bottom 0
        z-index 1
        display flex
        flex-direction column
        align-items center
        color #f0e6d3
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        background-repeat no-repeat
        background-size cover

        .close
            position absolute
            top 22px
            right 40px
            font-size 70px

        & > .header
            width 100%
            text-align center
            border-bottom 1px solid lightgray
            margin-top 20px
            padding-bottom 20px
            font-family "LoL Body"
            font-size 60px

        .overlay-content
            max-height "calc(100vh - %s)" % (timer-status-height + 90px)
            overflow-y scroll
            -webkit-overflow-scrolling touch

    .spell-selector .summoner
        box-sizing border-box
        padding 20px 10px
        width 100%
        display flex
        align-items center
        border-bottom 1px solid alpha(#cdbe93, 0.8)

        img
            margin 10px
            width 120px
            height 120px

        .spell-info
            flex 1
            display flex
            flex-direction column
            margin 0 20px

            .name
                font-size 45px

            .description
                font-size 30px
                color #fffaef


    .champ-selector .overlay-content
        display flex
        flex-wrap wrap
        justify-content center

        img
            box-sizing border-box
            border 2px solid transparent
            margin 15px
            width 200px
            height 200px
            opacity 0.6
            transition 0.3s ease

        img.selected
            border-color #c89c3c
            opacity 1

    .champ-selector-confirm-button
        box-sizing border-box
        margin 20px
        position relative
        width calc(100% - 20px)
        height 120px
        background-color rgb(30, 35, 40)
        text-transform uppercase
        color #a3c7c7
        font-size 60px
        font-family "LoL Display Bold"
        display flex
        justify-content center
        align-items center

        &[disabled]
            background-color #1e2328
            color #5c5b57

            .button-border
                border 3px solid #5c5b57 !important

        &.ban
            color #bd253c

            .button-border
                border-image linear-gradient(186deg, #c6403b, #f9413f, #ec3930, #ee241d) 1 stretch

        .button-border
            transition 0.3s ease
            position absolute
            top -3px
            left -3px
            width 100%
            height 100%
            border-width 6px
            border-style solid
            border-image linear-gradient(to top, #0d404c 0%, #0596aa 44%, #0596aa 93%, #0ac8b9 100%) 1 stretch
</style>