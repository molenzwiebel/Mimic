using System.Windows.Forms;

namespace Conduit
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        private NotifyIcon icon;
        private ConnectionManager manager;

        public App()
        {
            icon = new NotifyIcon()
            {
                Text = "Mimic Conduit",
                Icon = Conduit.Properties.Resources.mimic,
                Visible = true,
                ContextMenu = new ContextMenu(new MenuItem[]
                {
                    new MenuItem(Program.APP_NAME + " " + Program.VERSION)
                    {
                        Enabled = false
                    },
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

            // Unless we automatically launched at startup, display a bubble with info.
            if (!Persistence.LaunchesAtStartup())
            {
                ShowNotification("Mimic will run in the background. Click this notification or the Mimic icon in the system tray for more information and how to connect from your phone.");
            }
        }

        public void ShowNotification(string text)
        {
            icon.BalloonTipTitle = "Mimic Conduit";
            icon.BalloonTipText = text;
            icon.ShowBalloonTip(5000);
        }
    }
}