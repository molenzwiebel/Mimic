<template>
    <div class="socket-state">
        <!-- If no socket, show connection info. -->
        <template v-if="!socket">
            <h2>Welcome to Mimic!</h2>
            <p>Enter your computer code to start controlling League from your phone. You can find the code by
                right-clicking on the Mimic icon in the bottom right of your computer.</p>

            <code-entry class="code" v-model="code"></code-entry>
            <lcu-button class="button" :disabled="code.length !== 6" @click="connect">Connect!</lcu-button>
        </template>

        <!-- Failed getting a public key. Either the computer is offline or the code is incorrect. -->
        <template v-else-if="didFailPubkey">
            <h2>Connection Failed</h2>
            <img src="../../static/poros/poro-question.png">

            <p style="margin-bottom: 40px">The computer belonging to the code you entered could not be found. Make sure
                that both Conduit and League are running and
                that you entered the code correctly.</p>

            <lcu-button class="button" @click="connect">Try Again</lcu-button>
            <lcu-button class="button" @click="$emit('reset')">Cancel</lcu-button>
        </template>

        <!-- Failed because the desktop denied our request.. -->
        <template v-else-if="didGetDenied">
            <h2>Connection Denied</h2>
            <img src="../../static/poros/poro-angry.png">

            <p style="margin-bottom: 40px">The computer at {{ code }} explicitly denied the connection attempt. When
                connecting, make sure to press <b>Allow</b> on the window that pops up.</p>

            <lcu-button class="button" @click="connect">Try Again</lcu-button>
            <lcu-button class="button" @click="$emit('reset')">Cancel</lcu-button>
        </template>

        <!-- Connecting. This includes both connecting to Rift and talking through rift to the computer. -->
        <template v-else-if="isConnecting">
            <h2>Connecting</h2>
            <img src="../../static/poros/poro-coolguy.png">

            <p style="margin-bottom: 40px">Trying to connect to Mimic HQ... If this takes longer than a few seconds,
                check your internet connection.</p>

            <lcu-button class="button" @click="$emit('reset')" type="deny">Cancel</lcu-button>
        </template>

        <!-- At this point we're waiting for Conduit to accept our connection. -->
        <template v-else-if="isHandshaking">
            <h2>Waiting For Desktop</h2>
            <img src="../../static/poros/poro-coolguy.png">

            <p style="margin-bottom: 40px">Mimic is waiting for your desktop to approve the connection. Simply click the
                "Allow" button on your computer to accept the connection. Don't worry: you'll only have to do this once
                per device.</p>

            <lcu-button class="button" @click="$emit('reset')" type="deny">Cancel</lcu-button>
        </template>
    </div>
</template>

<script lang="ts">
    import RiftSocket, { RiftSocketState } from "./rift-socket";
    import CodeEntry from "./code-entry.vue";
    import { Component, Prop, Vue } from "vue-property-decorator";

    let didFirstMount = false;

    @Component({
        components: { CodeEntry }
    })
    export default class SocketState extends Vue {
        @Prop()
        socket: RiftSocket;
        code = localStorage ? localStorage.getItem("conduitID") || "" : "";

        mounted() {
            // On our first mount, check if we have a code from the query string. If we do,
            // automatically enter it and try to connect. Only do it on the first mount so if
            // the connection attempt fails, we don't end up automatically connecting again.
            if (!didFirstMount) {
                didFirstMount = true;

                const match = /\?code=(\d+)$/.exec(location.search);
                if (!match) return;

                // Clear the code from the URL in case the user ends up adding it to the homescreen.
                // The code gets saved anyway and this saves us the inconvenience of the user linking it to
                // their homescreen and then getting their code changed.
                window.history.replaceState("", "", window.location.pathname);

                this.code = match[1];
                this.connect();
            }
        }

        connect() {
            if (localStorage) localStorage.setItem("conduitID", this.code);
            this.$emit("connect", this.code);
        }

        get didFailPubkey() {
            return this.socket && this.socket.state === RiftSocketState.FAILED_NO_DESKTOP;
        }

        get didGetDenied() {
            return this.socket && this.socket.state === RiftSocketState.FAILED_DESKTOP_DENY;
        }

        get isConnecting() {
            return this.socket && this.socket.state === RiftSocketState.CONNECTING;
        }

        get isHandshaking() {
            return this.socket && this.socket.state === RiftSocketState.HANDSHAKING;
        }
    }
</script>

<style lang="stylus" scoped>
    .socket-state
        width 100%

        display flex
        flex-direction column
        align-items center
        text-align center

        h2
            font-family "LoL Header", serif
            font-size 100px
            color #f0e6d3
            padding 30px
            margin 0

        p
            font-family "LoL Body", sans-serif
            font-size 50px
            color #dcd2bf
            margin 10px 60px

        img
            filter grayscale()
            padding 30px

        .code
            padding 60px 30px

        .button
            width 70%
            margin-bottom 30px
</style>