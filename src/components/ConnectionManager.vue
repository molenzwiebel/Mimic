<template>
    <div>
        <div v-if="!connected" class="full-screen-msg">
            <span class="msg">Connecting...</span>
        </div>

        <div v-else="">
            <lobby></lobby>
            <invites></invites>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    import InviteManager = require("./InviteManager.vue");
    import LobbyManager = require("./LobbyManager.vue");

    @Component({
        components: {
            invites: InviteManager,
            lobby: LobbyManager
        }
    })
    export default class ConnectionManager extends Vue {
        connected: boolean = false;
        socket: WebSocket;

        observers: { [key: string]: (status: number, body: any) => void } = {};
        requests: { [key: number]: Function } = {};
        requestId = 0;

        created() {
            this.connect();
        }

        observe(path: string, handler: (status: number, body: any) => void) {
            this.observers[path] = handler;

            // Make initial request to populate the handler.
            this.request(path).then(({ status, content }) => handler(status, content));
        }

        unobserve(path: string) {
            delete this.observers[path];
        }

        request(path: string, method: string = "GET", body?: string): Promise<{ status: number, content: any }> {
            return new Promise(resolve => {
                const id = this.requestId++;
                this.socket.send(JSON.stringify([id, path, method, body]));
                this.requests[id] = resolve;
            });
        }

        handleMessage = (msg: MessageEvent) => {
            // [1, path, status, content]
            // OR
            // [2, id, status, content]

            const data: any = JSON.parse(msg.data);
            if (data[0] === 1 && this.observers[data[1]]) {
                this.observers[data[1]](data[2], data[3]);
            }

            if (data[0] === 2 && this.requests[data[1]]) {
                this.requests[data[1]]({ status: data[2], content: data[3] });
                delete this.requests[data[1]];
            }
        };

        private connect() {
            // TODO: Do not hardcode this.
            this.socket = new WebSocket("ws://192.168.1.9:8181");

            this.socket.onopen = () => {
                this.connected = true;
            };

            this.socket.onmessage = this.handleMessage;

            this.socket.onclose = () => {
                this.connected = false;
                setTimeout(() => {
                    this.connect();
                }, 1000);
            };
        }
    }
</script>

<style lang="stylus" scoped>
    .full-screen-msg
        position absolute
        background-image url(https://lolstatic-a.akamaihd.net/frontpage/apps/prod/lcu_alpha_website/en_US/c0dcb26e1ba53437859331627d5e2f01dfda818e/assets/img/bgs/magic-repeater.jpg)
        left 0
        top 0
        right 0
        bottom 0
        display flex
        justify-content center
        align-items center

    .msg
        color white
        font-size 100px
        font-family "Droid Sans"
</style>