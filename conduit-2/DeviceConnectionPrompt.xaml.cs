using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace Conduit
{
    /// <summary>
    /// Interaction logic for DeviceConnectionPrompt.xaml
    /// </summary>
    public partial class DeviceConnectionPrompt : Window
    {
        private const string PROMPT =
            "A DEVICE running BROWSER is trying to control your League client remotely using Mimic. Do you want to allow access?\r\n\r\nPressing allow will remember your choice and not prompt the next time. Only press allow if you recognize the device.";

        public delegate void HandleConnectionResultDelegate(bool result);

        public DeviceConnectionPrompt(string device, string browser, HandleConnectionResultDelegate handler)
        {
            InitializeComponent();

            // Add device name to the prompt.
            this.TextField.Text = PROMPT.Replace("DEVICE", device).Replace("BROWSER", browser);
            Console.WriteLine(device + ", " + browser);
            Console.WriteLine(PROMPT.Replace("DEVICE", device).Replace("BROWSER", browser));

            // If deny is pressed, close and return false.
            bool returned = false;
            this.DenyButton.Click += (sender, args) =>
            {
                returned = true;

                Close();
                handler(false);
            };

            // If allow is pressed, close and return true.
            this.AllowButton.Click += (sender, args) =>
            {
                returned = true;

                Close();
                handler(true);
            };

            // If the window is manually closed, treat it as a denial.
            this.Closed += (sender, args) =>
            {
                // Only handle this if the close wasn't caused by us.
                if (!returned) handler(false);
            };
        }
    }
}
