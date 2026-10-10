package au.com.fillmenow.app;
import static org.junit.Assert.*;
import android.os.SystemClock;
import android.view.View;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.*;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.*;
import java.util.concurrent.*;
@RunWith(AndroidJUnit4.class)
public class NativePolishTest {
 private ActivityScenario<MainActivity> scenario;
 private final UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
 private final StringBuilder checks=new StringBuilder();
 private File dir(){File d=new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null),"native-polish-qa");d.mkdirs();return d;}
 private String json(String exp)throws Exception{ArrayBlockingQueue<String> q=new ArrayBlockingQueue<>(1);scenario.onActivity(a->a.getBridge().getWebView().evaluateJavascript("JSON.stringify("+exp+")",q::offer));String s=q.poll(10,TimeUnit.SECONDS);assertNotNull(s);Object o=new JSONTokener(s).nextValue();return o==JSONObject.NULL?"null":o.toString();}
 private void run(String s)throws Exception{json("(()=>{"+s+";return true})()");}
 private void waitFor(String s,int seconds)throws Exception{long until=SystemClock.elapsedRealtime()+seconds*1000L;do{if("true".equals(json(s)))return;SystemClock.sleep(300);}while(SystemClock.elapsedRealtime()<until);fail("Condition not reached: "+s);}
 private void tap(String selector)throws Exception{String query=JSONObject.quote(selector);waitFor("!!document.querySelector("+query+")",15);String label=new JSONTokener(json("(()=>{const e=document.querySelector("+query+");e.scrollIntoView({block:'nearest'});return(e.getAttribute('aria-label')||e.innerText||e.value||'').trim()})()")).nextValue().toString();assertFalse(label.isEmpty());device.waitForIdle(1000);UiObject2 e=device.wait(Until.findObject(By.desc(label).enabled(true)),1500);if(e==null)e=device.wait(Until.findObject(By.text(label).enabled(true)),2000);assertNotNull("Missing visible native target: "+selector+" "+label,e);assertFalse(e.getVisibleBounds().isEmpty());e.click();}
 private void screen(String n){device.takeScreenshot(new File(dir(),n+".png"));}
 private void bounds(String name,boolean keyboard)throws Exception{
  SystemClock.sleep(800);ArrayBlockingQueue<String> q=new ArrayBlockingQueue<>(1);
  scenario.onActivity(a->{View decor=a.getWindow().getDecorView();WebView w=a.getBridge().getWebView();WindowInsetsCompat all=ViewCompat.getRootWindowInsets(decor);int[] p=new int[2],d=new int[2];w.getLocationOnScreen(p);decor.getLocationOnScreen(d);Insets s=all.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout()),ime=all.getInsets(WindowInsetsCompat.Type.ime());try{q.offer(new JSONObject().put("x",p[0]).put("y",p[1]).put("w",w.getWidth()).put("h",w.getHeight()).put("dx",d[0]).put("dy",d[1]).put("dw",decor.getWidth()).put("dh",decor.getHeight()).put("top",s.top).put("bottom",s.bottom).put("left",s.left).put("right",s.right).put("ime",ime.bottom).put("keyboard",all.isVisible(WindowInsetsCompat.Type.ime())).toString());}catch(Exception e){throw new RuntimeException(e);}});
  JSONObject b=new JSONObject(q.poll(10,TimeUnit.SECONDS));assertTrue(name+" status bar overlap: "+b,b.getInt("y")>=b.getInt("dy")+b.getInt("top")-2);assertTrue(name+" bottom system/keyboard overlap: "+b,b.getInt("y")+b.getInt("h")<=b.getInt("dy")+b.getInt("dh")-Math.max(b.getInt("bottom"),b.getInt("ime"))+2);assertTrue(name+" left cutout overlap",b.getInt("x")>=b.getInt("dx")+b.getInt("left")-2);assertTrue(name+" right cutout overlap",b.getInt("x")+b.getInt("w")<=b.getInt("dx")+b.getInt("dw")-b.getInt("right")+2);if(keyboard)assertTrue("Keyboard did not open",b.getBoolean("keyboard"));
  assertEquals(name+" HTML overflow","false",json("document.documentElement.scrollWidth>innerWidth+1"));checks.append(name).append(": ").append(b).append('\n');
 }
 @Test public void nativeInsetsAndScreensStayReachable()throws Exception{
  assertTrue(android.os.Build.FINGERPRINT.contains("generic")||android.os.Build.MODEL.contains("sdk"));device.setOrientationNatural();scenario=ActivityScenario.launch(MainActivity.class);
  try{
   waitFor("document.readyState==='complete'&&!!window.FMNJourneyApp",45);
   run("localStorage.setItem('fmnOnboarded','1');localStorage.setItem('fdLoc',JSON.stringify({lat:-27.47,lng:153.025,state:'QLD',label:'Native layout test'}));localStorage.setItem('fdPrefs',JSON.stringify({state:'QLD',fuel:'Diesel',radius:10,alertRadius:25,tank:250,economy:35,vehicle:'truck',truck:{height:4.2,width:2,length:12,weight:12,configuration:'rigid'},frequency:'off'}));window.__visualReload=true;location.reload()");
   waitFor("!window.__visualReload&&document.readyState==='complete'&&!!document.getElementById('nativeStatus')&&Number(document.getElementById('statCount').textContent)>0",50);
   if("false".equals(json("document.getElementById('mobileSheet').classList.contains('is-collapsed')")))run("FD.sheet()");
   waitFor("getComputedStyle(document.getElementById('followToggle')).display==='none'",5);bounds("portrait",false);screen("01-explore-portrait");
   assertEquals("64",json("document.querySelector('.topbar.app-topbar').getBoundingClientRect().height"));assertEquals("68",json("document.querySelector('.bottom-nav').getBoundingClientRect().height"));
   tap("#mapStationCount");waitFor("document.body.dataset.page==='options'",10);bounds("Nearby",false);screen("02-nearby");tap("#optionsBack");
   tap("#topArea");waitFor("!!document.querySelector('#areaModal.open')",10);bounds("Search",false);screen("03-search");tap("#areaClose");
   tap(".nav[data-page='more']");bounds("More",false);screen("04-more");tap("[data-open-panel='vehicle']");waitFor("document.querySelector('#settingsDrawer').classList.contains('open')",10);bounds("Vehicle",false);screen("05-vehicle");assertEquals("\"250\"",json("document.getElementById('tankInput').value"));assertEquals("\"4.2\"",json("document.getElementById('truckHeight').value"));
   tap("#tankInput");SystemClock.sleep(1200);bounds("Vehicle keyboard",true);screen("06-vehicle-keyboard");device.pressBack();SystemClock.sleep(500);tap("#drawerBack");
   for(String page:new String[]{"saved","alerts"}){tap(".nav[data-page='"+page+"']");bounds(page,false);screen("07-"+page);}
   tap(".nav[data-page='explore']");device.setOrientationLeft();waitFor("innerWidth>innerHeight",15);bounds("Landscape",false);screen("08-explore-landscape");assertEquals("56",json("document.querySelector('.topbar.app-topbar').getBoundingClientRect().height"));
   device.setOrientationNatural();waitFor("innerHeight>innerWidth",15);
   for(String mode:new String[]{"threebutton","gestural"}){String response=device.executeShellCommand("cmd overlay enable-exclusive --category com.android.internal.systemui.navbar."+mode);assertFalse(response.contains("Error"));SystemClock.sleep(1500);bounds("Navigation "+mode,false);screen("09-navigation-"+mode);}
   run("window.FMNPermissionUI.open()");waitFor("!!document.querySelector('#nativeLocationDialog[open]')",10);bounds("Native permission help",false);screen("10-native-help");tap("#nativeLocationDialog footer button");
   checks.append("PASS: Native content bounds outside system bars/cutout/IME; compact portrait and landscape; native help and app screens reachable. Actual device reception not tested.\n");
  }catch(Throwable t){screen("failure");device.dumpWindowHierarchy(new File(dir(),"failure.xml"));throw t;}finally{try(FileOutputStream f=new FileOutputStream(new File(dir(),"layout-checks.txt"))){f.write(checks.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));}device.setOrientationNatural();device.unfreezeRotation();if(scenario!=null)scenario.close();}
 }
}
