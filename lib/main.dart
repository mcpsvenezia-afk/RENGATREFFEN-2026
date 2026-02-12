import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Richiedi permessi all'avvio
  await [
    Permission.camera,
    Permission.location,
    Permission.storage,
    Permission.microphone,
  ].request();

  runApp(const RengaRaceApp());
}

class RengaRaceApp extends StatelessWidget {
  const RengaRaceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Renga Race 2026',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const RengaWebView(),
    );
  }
}

class RengaWebView extends StatefulWidget {
  const RengaWebView({super.key});
  @override
  State<RengaWebView> createState() => _RengaWebViewState();
}

class _RengaWebViewState extends State<RengaWebView> {
  // URL DI PARTENZA
  final String initialUrl = 'https://rengatreffen.it/race-login';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(initialUrl)),
          
          initialSettings: InAppWebViewSettings(
            userAgent: "RengaRaceApp/1.0 (Mobile)", // User Agent Segreto
            javaScriptEnabled: true,
            mediaPlaybackRequiresUserGesture: false,
            allowsInlineMediaPlayback: true,
            iframeAllow: "camera; microphone",
            iframeAllowFullscreen: true,
            geolocationEnabled: true, 
            allowFileAccessFromFileURLs: true,
            allowUniversalAccessFromFileURLs: true,
            useHybridComposition: true, // Fondamentale per Android
          ),

          // IL FIX: Concede automaticamente i permessi
          onPermissionRequest: (controller, request) async {
            return PermissionResponse(
              resources: request.resources,
              action: PermissionResponseAction.GRANT,
            );
          },

          onGeolocationPermissionsShowPrompt: (controller, origin) async {
            return GeolocationPermissionShowPromptResponse(
                origin: origin, allow: true, retain: true);
          },
        ),
      ),
    );
  }
}
