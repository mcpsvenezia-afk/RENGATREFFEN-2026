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
import 'package:path/path.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dio/dio.dart';
import 'package:open_file/open_file.dart';
import 'package:package_info_plus/package_info_plus.dart';

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

  @override
  void initState() {
    super.initState();
    _checkForUpdates();
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..loadRequest(Uri.parse(RACE_APP_URL));
  }

  // AUTO-UPDATE PROPRIETARIO
  Future<void> _checkForUpdates() async {
    try {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      String currentVersion = packageInfo.version;

      var response = await Dio().get(VERSION_JSON_URL);
      if (response.statusCode == 200) {
        String remoteVersion = response.data['version']; // Assumendo { "version": "1.0.2" }
        
        // Confronto versioni grezzo (può essere migliorato)
        if (remoteVersion != currentVersion) {
          bool? update = await showDialog(
            context: context, 
            builder: (ctx) => AlertDialog(
              title: const Text("Aggiornamento Disponibile"),
              content: Text("Nuova versione $remoteVersion. Scaricare ora?"),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Dopo")),
                TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("AGGIORNA")),
              ],
            )
          );

          if (update == true) {
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
      
      await Dio().download(APK_URL, savePath, onReceiveProgress: (rec, total) {
        // Mostra progress bar (opzionale)
      });

      await OpenFile.open(savePath);
      
    } catch (e) {
      print("Install failed: $e");
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Errore download aggiornamento")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: Scaffold(
        body: SafeArea(
          child: WebViewWidget(controller: controller),
        ),
      ),
    );
  }
}
