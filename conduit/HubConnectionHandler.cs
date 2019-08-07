﻿using System;
using System.Collections.Generic;
using System.Web;
using System.Windows;
using WebSocketSharp;

namespace Conduit
{
    /**
     * This class handles all connection with the hub and delegates any threaded messages to their
     * appropriate mobile connection handlers. This class is not responsible for ensuring that the JWT
     * is valid or keeping track of rift/league connection state. The wrapper class for this class, 
     * ConnectionManager, is in charge of reconnection and JWT registration.
     */
    class HubConnectionHandler
    {
#if DEBUG
        public static HubConnectionHandler Instance;
#endif

        private WebSocket socket;
        private LeagueConnection league;
        private Dictionary<string, MobileConnectionHandler> connections = new Dictionary<string, MobileConnectionHandler>();

        public event Action OnClose;
        private bool hasClosed = false;

        private string readyCheckState = "Invalid";

        public HubConnectionHandler(LeagueConnection league)
        {
#if DEBUG
            Instance = this;
#endif

            this.league = league;

            league.Observe("/lol-matchmaking/v1/ready-check", HandleReadyCheckChange);

            // Pass parameters in the URL.
            socket = new WebSocket(
                Program.HUB_WS
                    + "?token=" + HttpUtility.UrlEncode(Persistence.GetHubToken())
                    + "&publicKey=" + HttpUtility.UrlEncode(CryptoHelpers.ExportPublicKey())
            );

            socket.OnMessage += HandleMessage;
            socket.OnClose += (sender, ev) =>
            {
                // Invoke the close handler unless we explicitly triggered this closure.
                // Note that we invoke the event handler and close ourselves as well.
                // This means that in all cases, anyone listening to the closure event does
                // not have to close us. They only need to call Close on us if we want to
                // terminate a connection that is still stable.
                if (!hasClosed)
                {
                    OnClose?.Invoke();
                    Close();
                }
            };

            socket.Connect();
        }

        /**
         * Closes the connection with the hub. Should be invoked when League closes.
         */
        public void Close()
        {
            if (hasClosed) return;
            hasClosed = true;

            // Close socket.
            if (socket.ReadyState == WebSocketState.Open) socket.Close();

            // Call destructors for mobile connections.
            foreach (var connection in connections.Values) connection.OnClose();

            // Release resources.
            socket = null;
            league = null;

            connections.Clear();
            connections = null;
        }

        /**
         * Sends a message to Rift to register the specified PN token and device type for the
         * current conduit instance. Does nothing if we don't have a Rift connection.
         */
        public void RegisterPushNotificationToken(string token, string type)
        {
            if (hasClosed || socket == null || socket.ReadyState != WebSocketState.Open) return;

            socket.Send("[" + (long)RiftOpcode.PNSubscribe + ",\"" + token + "\",\"" + type + "\"]");
        }

        /**
         * Sends a ready check push notification with the specified content. Specify null to
         * remove all outstanding push notifications instead.
         */
        public void SendReadyCheckPushNotification(string content)
        {
            if (hasClosed || socket == null || socket.ReadyState != WebSocketState.Open) return;

            socket.Send("[" + (long)RiftOpcode.PNSend + ", \"readyCheck\", " + (content == null ? "null" : "\"" + content + "\"") + "]");
        }

        private void HandleMessage(object sender, MessageEventArgs ev)
        {
            if (!ev.IsText) return;

            dynamic contents = SimpleJson.DeserializeObject(ev.Data);
            if (!(contents is JsonArray)) return;

            // We got a new connection!
            if (contents[0] == (long) RiftOpcode.Open)
            {
                if (connections.ContainsKey(contents[1])) return;

                connections.Add(contents[1], new MobileConnectionHandler(this, league, msg =>
                {
                    socket.Send("[" + (long) RiftOpcode.Reply + ",\"" + contents[1] + "\"," + msg + "]");
                }));
            }
            else if (contents[0] == (long) RiftOpcode.Message)
            {
                if (!connections.ContainsKey(contents[1])) return;
            
                connections[contents[1]].HandleMessage(contents[2]);
            }
            else if (contents[0] == (long) RiftOpcode.Close)
            {
                if (!connections.ContainsKey(contents[1])) return;

                connections[contents[1]].OnClose();
                connections.Remove(contents[1]);
            }
            else if (contents[0] == (long) RiftOpcode.PNResponse)
            {
                DebugLogger.Global.WriteMessage("User responded with " + (string)contents[2] + " to " + (string)contents[1]);

                if (contents[1].Equals("readyCheck"))
                {
                    league.Request("POST", "/lol-matchmaking/v1/ready-check/" + (string) contents[2], null);
                }

#if DEBUG
                MessageBox.Show("Received push notification response: " + (string)contents[2], "Mimic Conduit", MessageBoxButton.OK);
#endif
            }
        }

        private void HandleReadyCheckChange(dynamic data)
        {
            var newState = data == null ? "Invalid" : (string)data.state;

            // Ready check just popped.
            if (newState == "InProgress" && readyCheckState != "InProgress")
            {
                this.SendReadyCheckPushNotification("🔔 Your queue has popped! Tap here to open Mimic.");
            }

            // Ready check just got accepted/denied.
            if (newState != "InProgress" && readyCheckState == "InProgress")
            {
                this.SendReadyCheckPushNotification(null);
            }

            readyCheckState = newState;
        }
    }

    /**
     * Represents an operation sent by the hub. Incomplete, contains only definitions we're interested in.
     */
    enum RiftOpcode : long
    {
        // New connection from mobile client.
        Open = 1,

        // New message from previously connected client.
        Message = 2,

        // Mobile client connection closed.
        Close = 3,

        // Send a message to a mobile connected peer.
        Reply = 7,

        // Subscribe a phone to notifications for the current conduit.
        PNSubscribe = 9,

        // Send a push notification for the current conduit.
        PNSend = 10,

        // Receive an instant response to an emitted push notification.
        PNResponse = 11
    }
}
