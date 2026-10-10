package au.com.fillmenow.app;
import android.os.Bundle;
import android.app.Activity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginCall;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.*;
public final class MainActivity extends BridgeActivity {
 private PluginCall pendingSettings;
 private final ActivityResultLauncher<IntentSenderRequest> resolution=registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(),r->{PluginCall p=pendingSettings;pendingSettings=null;if(p!=null){if(r.getResultCode()==Activity.RESULT_OK)p.resolve();else p.reject("Phone Location was not enabled","LOCATION_SETTINGS_DECLINED");}});
 @Override public void onCreate(Bundle b){
  registerPlugin(FMNSettingsPlugin.class);super.onCreate(b);
  androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(),false);
  androidx.core.view.WindowInsetsControllerCompat bars=androidx.core.view.WindowCompat.getInsetsController(getWindow(),getWindow().getDecorView());
  bars.setAppearanceLightStatusBars(true);bars.setAppearanceLightNavigationBars(true);
  android.view.View root=findViewById(android.R.id.content);
  root.setBackgroundColor(android.graphics.Color.WHITE);
  if(getBridge()!=null)getBridge().getWebView().setPadding(0,0,0,0);
  // Inset the CONTAINER, not the WebView drawing surface. This changes the HTML viewport too.
  ViewCompat.setOnApplyWindowInsetsListener(root,(v,insets)->{
   androidx.core.graphics.Insets safe=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());
   androidx.core.graphics.Insets keyboard=insets.getInsets(WindowInsetsCompat.Type.ime());
   v.setPadding(safe.left,safe.top,safe.right,Math.max(safe.bottom,keyboard.bottom));
   return WindowInsetsCompat.CONSUMED;
  });
  ViewCompat.requestApplyInsets(root);
 }
 public void ensureLocation(PluginCall call){
  if(pendingSettings!=null){call.reject("Location setup already in progress","SETTINGS_BUSY");return;}
  pendingSettings=call;
  LocationRequest q=new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY,1000L).build();
  LocationServices.getSettingsClient(this).checkLocationSettings(new LocationSettingsRequest.Builder().addLocationRequest(q).setAlwaysShow(true).build())
   .addOnSuccessListener(this,r->{if(pendingSettings==call){pendingSettings=null;call.resolve();}})
   .addOnFailureListener(this,e->{if(pendingSettings!=call)return;if(e instanceof ResolvableApiException){try{resolution.launch(new IntentSenderRequest.Builder(((ResolvableApiException)e).getResolution()).build());}catch(Exception x){pendingSettings=null;call.reject("Open phone Location settings","LOCATION_SETTINGS_ERROR");}}else{pendingSettings=null;call.reject("Location settings unavailable","LOCATION_SETTINGS_ERROR");}});
 }
 @Override public void onDestroy(){if(pendingSettings!=null){pendingSettings.reject("App closed during location setup","CANCELLED");pendingSettings=null;}super.onDestroy();}
}
