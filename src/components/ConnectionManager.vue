<template>
    <div>
        <div v-if="!connected" class="full-screen-msg">
            Connecting...
        </div>

        <div v-else="" class="full-screen-msg">
            Connected!
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";

    @Component({
        provide: ["observe"]
    })
    export default class ConnectionManager extends Vue {
        connected: boolean = false;
        socket: WebSocket;
        observers: { [key: string]: (status: number, body: any) => void } = {};

        created() {
            this.connect();
        }

        observe = (path: string, handler: (status: number, body: any) => void) => {
            this.observers[path] = handler;
        };

        handleMessage = (msg: MessageEvent) => {
            const data: [string, number, any] = JSON.parse(msg.data);
            if (this.observers[data[0]]) {
                this.observers[data[0]](data[1], data[2]);
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
        margin 0
        padding 0
        background-color blue
        left 0
        top 0
        right 0
        bottom 0
        display flex
        justify-content center
        align-items center
        color white
        font-size 100px
        font-family "Droid Sans"
</style>