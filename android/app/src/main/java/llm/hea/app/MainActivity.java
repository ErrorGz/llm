package llm.hea.app;

import com.getcapacitor.BridgeActivity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

public class MainActivity extends BridgeActivity {
    public static class MyForegroundService extends Service {
        private static final String CHANNEL_ID = "ForegroundServiceChannel";

        @Override
        public void onCreate() {
            super.onCreate();
            createNotificationChannel();
            startForeground(1, getNotification());
        }

        private void createNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Foreground Service Channel",
                    NotificationManager.IMPORTANCE_DEFAULT
                );
                NotificationManager manager = getSystemService(NotificationManager.class);
                manager.createNotificationChannel(serviceChannel);
            }
        }

        private Notification getNotification() {
            return new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("App is running in background")
                .setContentText("Your app is performing background tasks")
                .setSmallIcon(R.drawable.duck96) // 使用新添加的图标
                .build();
        }

        @Override
        public IBinder onBind(Intent intent) {
            return null;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent serviceIntent = new Intent(this, MyForegroundService.class);
        startService(serviceIntent);
    }
}
