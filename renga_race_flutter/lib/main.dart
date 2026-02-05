import 'dart:async';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:sqflite/sqflite.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dio/dio.dart';
import 'package:open_file/open_file.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

// CONFIGURAZIONE
const String RACE_APP_URL = "https://www.rengatreffen.it/race-app.html";
const String VERSION_JSON_URL = "https://www.rengatreffen.it/download/version.json";
const String APK_URL = "https://www.rengatreffen.it/download/renga-race.apk";

// SUPABASE CONFIG (Inserire TUE chiavi vere)
const String SUPABASE_URL = "https://tuo-url.supabase.co";
const String SUPABASE_ANON_KEY = "tua-chiave-anon";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Permessi critici all'avvio
  await _requestPermissions();

  // 2. Init Background Service
  await initializeService();

  // 3. Keep Screen Awake
  WakelockPlus.enable();

  runApp(const RengaRaceApp());
}

Future<void> _requestPermissions() async {
  await [
    Permission.location,
    Permission.locationAlways,
    Permission.notification,
    Permission.requestInstallPackages,
  ].request();
}

// --- BACKGROUND SERVICE (Core GPS Logic) ---
Future<void> initializeService() async {
  final service = FlutterBackgroundService();
  
  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: true,
      isForegroundMode: true,
      notificationChannelId: 'renga_race_gps',
      initialNotificationTitle: 'Renga Race Active',
      initialNotificationContent: 'GPS Tracking in corso...',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(),
  );
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  
  // Setup Notifications
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });
    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  // GPS LOOP (Ogni 30 secondi)
  Timer.periodic(const Duration(seconds: 30), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        
        try {
          Position pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
          
          // >>> SALVA SU DB LOCALE (Codice semplificato per brevità)
          print('GPS TRACK: ${pos.latitude}, ${pos.longitude}');
          
          // Update Notifica per far vedere che è vivo
          flutterLocalNotificationsPlugin.show(
            888,
            'Renga Race Active',
            'GPS OK: ${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}',
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'renga_race_gps',
                'GPS Service',
                icon: 'ic_bg_service_small',
                ongoing: true,
              ),
            ),
          );
          
          // >>> TENTA SYNC SUPABASE QUI <<<

        } catch (e) {
          print("GPS Error: $e");
        }
      }
    }
  });
}

// --- UI PRINCIPALE (WebView) ---
class RengaRaceApp extends StatefulWidget {
  const RengaRaceApp({super.key});

  @override
  State<RengaRaceApp> createState() => _RengaRaceAppState();
}

class _RengaRaceAppState extends State<RengaRaceApp> {
  late final WebViewController controller;
  
  // STATO SENSORI
  String _networkState = "Init...";
  Color _networkColor = Colors.grey;
  
  double _gpsAccuracy = 999.0;
  Color _gpsColor = Colors.red;
  
  StreamSubscription? _netSub;
  StreamSubscription? _gpsSub;

  @override
  void initState() {
    super.initState();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkForUpdates();
      _requestCameraPermission(); // Extra check
    });
    
    // 1. SETUP WEBVIEW
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPermissionRequest: (WebViewPermissionRequest request) {
            request.grant(request.resources); // AUTORIZZA CAMERA AL VOLO
          },
        ),
      )
      ..loadRequest(Uri.parse(RACE_APP_URL));

    // 2. SETUP NETWORK LISTENER
    _netSub = Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (!mounted) return;
      setState(() {
         // Prendi il più forte
         if (results.contains(ConnectivityResult.wifi)) {
           _networkState = "WIFI";
           _networkColor = Colors.green;
         } else if (results.contains(ConnectivityResult.mobile)) {
           _networkState = "4G/5G";
           _networkColor = Colors.lightBlue;
         } else if (results.contains(ConnectivityResult.none)) {
           _networkState = "OFFLINE";
           _networkColor = Colors.red;
         } else {
           _networkState = "Link";
           _networkColor = Colors.amber;
         }
      });
    });

    // 3. SETUP GPS LISTENER (UI Only)
    _gpsSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.best, distanceFilter: 2)
    ).listen((Position pos) {
      if (!mounted) return;
      setState(() {
        _gpsAccuracy = pos.accuracy;
        if (_gpsAccuracy <= 5.0) {
          _gpsColor = Colors.greenAccent;
        } else if (_gpsAccuracy <= 15.0) {
          _gpsColor = Colors.lightGreen;
        } else if (_gpsAccuracy <= 30.0) {
          _gpsColor = Colors.orange;
        } else {
          _gpsColor = Colors.red;
        }
      });
    }, onError: (e) => print("GPS Stream Error: $e"));
  }
  
  @override
  void dispose() {
    _netSub?.cancel();
    _gpsSub?.cancel();
    super.dispose();
  }
  
  Future<void> _requestCameraPermission() async {
     await Permission.camera.request();
     await Permission.microphone.request();
  }

  // AUTO-UPDATE PROPRIETARIO (Semplificato)
  Future<void> _checkForUpdates() async {
    if (!mounted) return;
    try {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      String currentVersion = packageInfo.version;

      var response = await Dio().get(VERSION_JSON_URL);
      if (response.statusCode == 200) {
        if (!mounted) return;
        String remoteVersion = response.data['version']; 
        
        if (remoteVersion != currentVersion) {
          if (!mounted) return;
          
          bool? update = await showDialog<bool>(
            context: context, 
            builder: (ctx) => AlertDialog(
              backgroundColor: Colors.grey[900],
              title: const Text("Aggiornamento Trovato", style: TextStyle(color: Colors.white)),
              content: Text("Versione $remoteVersion disponibile. Scaricare?", style: TextStyle(color: Colors.white70)),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Ignora")),
                TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("AGGIORNA SUBITO", style: TextStyle(color: Colors.cyanAccent))),
              ],
            )
          );

          if (update == true && mounted) {
            _downloadAndInstall();
          }
        }
      }
    } catch (e) {
      print("Update check failed: $e");
    }
  }

  Future<void> _downloadAndInstall() async {
    try {
      Directory dir = await Directory.systemTemp.createTemp();
      String savePath = "${dir.path}/renga_update.apk";
      await Dio().download(APK_URL, savePath);
      await OpenFile.open(savePath);
    } catch (e) {
      print("Install failed: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Stack(
            children: [
              // 1. WEBVIEW
              WebViewWidget(controller: controller),
              
              // 2. TECH DASHBOARD OVERLAY
              Positioned(
                top: 0, left: 0, right: 0,
                child: Container(
                  height: 30,
                  color: Colors.black.withOpacity(0.6),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // SINISTRA: Versione App
                      FutureBuilder<PackageInfo>(
                        future: PackageInfo.fromPlatform(),
                        builder: (ctx, snap) => Text(
                          "v${snap.data?.version ?? '...'}", 
                          style: const TextStyle(color: Colors.grey, fontSize: 10, fontFamily: "monospace")
                        ),
                      ),
                      
                      // DESTRA: Indicatori
                      Row(
                        children: [
                          // Rete
                          Icon(
                            _networkState == "WIFI" ? Icons.wifi : Icons.signal_cellular_alt,
                            color: _networkColor, size: 14
                          ),
                          const SizedBox(width: 4),
                          Text(_networkState, style: TextStyle(color: _networkColor, fontSize: 11, fontWeight: FontWeight.bold)),
                          
                          const SizedBox(width: 15),
                          
                          // GPS
                          Icon(Icons.satellite_alt, color: _gpsColor, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            "GPS: ±${_gpsAccuracy < 900 ? _gpsAccuracy.toInt() : '-'}m ${(_gpsAccuracy < 10) ? '[3D FIX]' : ''}", 
                            style: TextStyle(color: _gpsColor, fontSize: 11, fontWeight: FontWeight.bold)
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
