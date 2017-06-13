using System;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Threading;

namespace MimicConduit
{
    class SingleGlobalInstance : IDisposable
    {
        public bool hasHandle = false;
        private Mutex mutex;

        private void InitMutex()
        {
            string appGuid = ((GuidAttribute)Assembly.GetExecutingAssembly().GetCustomAttributes(typeof(GuidAttribute), false).GetValue(0)).Value.ToString();
            string mutexId = string.Format("Global\\{{{0}}}", appGuid);
            mutex = new Mutex(false, mutexId);

            var allowEveryoneRule = new MutexAccessRule(new SecurityIdentifier(WellKnownSidType.WorldSid, null), MutexRights.FullControl, AccessControlType.Allow);
            var securitySettings = new MutexSecurity();
            securitySettings.AddAccessRule(allowEveryoneRule);
            mutex.SetAccessControl(securitySettings);
        }

        public SingleGlobalInstance(int timeOut)
        {
            InitMutex();
            try
            {
                hasHandle = mutex.WaitOne(timeOut <= 0 ? Timeout.Infinite : timeOut, false);

                if (!hasHandle)
                    throw new TimeoutException("Timeout waiting for exclusive access on SingleInstance");
            }
            catch (AbandonedMutexException)
            {
                hasHandle = true;
            }
        }

        public void Dispose()
        {
            if (mutex != null)
            {
                if (hasHandle)
                    mutex.ReleaseMutex();
                mutex.Dispose();
            }
        }
    }
}
