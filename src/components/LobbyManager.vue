<template>
    <div v-if="hasLobby" class="lobby">
        Lobby:<br>
        <span v-for="member in lobbyData.members">{{ member.summoner.displayName }} - {{ member.positionPreferences.firstPreference }} - {{ member.positionPreferences.secondPreference }}<br></span>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    interface LobbyMember {
        summoner: { displayName: string, profileIconId: number };
        canInviteOthers: boolean;
        id: number;
        isOwner: boolean;
        positionPreferences: {
            firstPreference: string;
            secondPreference: string;
        }
    }

    interface Lobby {
        autoFillEligible: boolean;
        canStartMatchmaking: boolean;
        showPositionSelector: boolean;
        localMember: LobbyMember;
        members: LobbyMember[];
    }

    @Component
    export default class InviteManager extends Vue {
        $root: Vue & {
            observe: (key: string, handler: (status: number, data: any) => void) => void;
            unobserve: (key: string) => void;
            request: (path: string, method?: string, body?: string) => Promise<{ status: number, content: any }>;
        };

        hasLobby: boolean = false;
        lobbyData: Lobby = <Lobby><any>{};

        mounted() {
            this.$root.observe("/lol-lobby/v1/lobby", async (status, data) => {
                if (status !== 200) {
                    this.hasLobby = false;
                    return;
                }

                const lobby: Lobby = <Lobby>data;
                await Promise.all(lobby.members.map(async mem => {
                    mem.summoner = (await this.$root.request("/lol-summoner/v1/summoners/" + mem.id)).content;
                }));
                lobby.localMember.summoner = lobby.members.filter(x => x.id === lobby.localMember.id)[0].summoner;

                this.hasLobby = true;
                this.lobbyData = lobby;
            });
        }

        destroyed() {
            this.$root.unobserve("/lol-lobby/v1/lobby");
        }

        memberImage(member: LobbyMember) {
            return `http://ddragon.leagueoflegends.com/cdn/7.5.2/img/profileicon/${member.summoner.profileIconId}.png`;
        }
    }
</script>

<style lang="stylus" scoped>
    .lobby
        font-size 50px
</style>