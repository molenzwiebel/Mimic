using System.Windows.Forms;

namespace Conduit
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        private NotifyIcon icon;

        public App()
        {
            icon = new NotifyIcon()
            {
                Text = "Sentinel",
                Icon = Conduit.Properties.Resources.mimic,
                Visible = true,
                ContextMenu = new ContextMenu(new MenuItem[]
                {
                    new MenuItem("Mimic Conduit v2.0.0")
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
        }
    }
}