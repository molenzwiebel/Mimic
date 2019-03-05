using System.Windows.Forms;

namespace Conduit
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        private NotifyIcon icon;
        private MenuItem codeMenuItem;
        private ConnectionManager manager;

        public App()
        {
            codeMenuItem = new MenuItem
            {
                Enabled = false
            };

            icon = new NotifyIcon
            {
                Text = "Mimic Conduit",
                Icon = Conduit.Properties.Resources.mimic,
                Visible = true,
                ContextMenu = new ContextMenu(new []
                {
                    new MenuItem(Program.APP_NAME + " " + Program.VERSION)
                    {
                        Enabled = false
                    },
                    codeMenuItem,
                    new MenuItem("Settings", (sender, ev) =>
                    {
                        new AboutWindow().Show();
                    }),
                    new MenuItem("Quit", (a, b) => Shutdown())
                })
            };

            icon.Click += (a, b) =>
            {
                // Only open about if left mouse is used (otherwise right clicking opens both context menu and about).
                if (b is MouseEventArgs args && args.Button == MouseButtons.Left)
                    new AboutWindow().Show();
            };

            icon.BalloonTipClicked += (a, b) =>
            {
                new AboutWindow().Show();
            };

            manager = new ConnectionManager(this);
            Persistence.OnHubCodeChanged += UpdateCodeMenuItemText;
            UpdateCodeMenuItemText();

            // Unless we automatically launched at startup, display a bubble with info.
            if (!Persistence.LaunchesAtStartup())
            {
                ShowNotification("Mimic will run in the background. Click this notification or the Mimic icon in the system tray for more information and how to connect from your phone.");
            }
        }

        /**
         * Updates the code menu item with the current code, if it has changed.
         */
        private void UpdateCodeMenuItemText()
        {
            var code = Persistence.GetHubCode();
            if (code == null)
            {
                codeMenuItem.Text = "Start League to generate an access code!";
            }
            else
            {
                codeMenuItem.Text = "Access Code: " + code;
            }
        }

        /**
         * Shows a simple notification with the specified text for 5 seconds.
         */
        public void ShowNotification(string text)
        {
            icon.BalloonTipTitle = "Mimic Conduit";
            icon.BalloonTipText = text;
            icon.ShowBalloonTip(5000);
        }
    }
}