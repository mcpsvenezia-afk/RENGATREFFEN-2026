import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:share_plus/share_plus.dart';
import 'package:image_picker/image_picker.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
  final String initialUrl = 'https://www.rengatreffen.it/race-app.html';
  late final WebViewController _controller;
  
  bool isLogVisible = false; 
  String lastGpsStatus = "?? In attesa...";
  List<String> eventLog = []; 
  bool _isControllerInitialized = false;

  @override
  void initState() {
    super.initState();
    _initSystem();
    
    // --- SETUP SEMPLIFICATO (SOLO ANDROID/STANDARD) ---
    // Rimosso il blocco if(WebKit) che dava errore su Android
    final PlatformWebViewControllerCreationParams params = const PlatformWebViewControllerCreationParams();

    final WebViewController controller = WebViewController.fromPlatformCreationParams(params);

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            addLog("Pagina Caricata");
            controller.runJavaScript("""
              function gestisciInput() {
                  var inputs = document.querySelectorAll("input[type='file']");
                  inputs.forEach(function(input) {
                      input.setAttribute('capture', 'environment');
                      input.setAttribute('accept', 'image/*');
                  });
              }
              setInterval(gestisciInput, 2000);
            """);
          },
          onWebResourceError: (WebResourceError error) {
            addLog("Errore Web: " + error.description, isError: true);
          },
        ),
      )
      ..loadRequest(Uri.parse(initialUrl));

    // --- CONFIGURAZIONE SPECIFICA ANDROID ---
    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController androidController = controller.platform as AndroidWebViewController;
      AndroidWebViewController.enableDebugging(true);
      androidController.setMediaPlaybackRequiresUserGesture(false);
      
      // INTERCETTATORE FOTOCAMERA
      androidController.setOnShowFileSelector((FileSelectorParams params) async {
        addLog("RICHIESTA FILE DETECTED!");
        bool isImage = params.acceptTypes.any((type) => type.contains("image"));

        // Se è un'immagine, apriamo la camera
        if (isImage) {
            try {
                addLog("Apertura Camera Nativa...");
                final ImagePicker picker = ImagePicker();
                final XFile? photo = await picker.pickImage(source: ImageSource.camera);
                
                if (photo != null) {
                    addLog("Foto OK: " + photo.path);
                    return [Uri.file(photo.path).toString()]; 
                } else {
                    addLog("Annullato dall'utente.");
                    return [];
                }
            } catch (e) {
                addLog("Errore Cam: " + e.toString(), isError: true);
                return [];
            }
        }
        return [];
      });
    }

    _controller = controller;
    setState(() {
      _isControllerInitialized = true;
    });
  }

  Future<void> _initSystem() async {
    try { await WakelockPlus.enable(); } catch (e) {}
    await [
      Permission.camera,
      Permission.location,
      Permission.locationAlways,
      Permission.storage,
      Permission.microphone,
    ].request();
  }

  void addLog(String msg, {bool isError = false}) {
    if (!mounted) return;
    setState(() {
      String prefix = isError ? "? " : "?? ";
      String time = DateTime.now().hour.toString() + ":" + DateTime.now().minute.toString() + ":" + DateTime.now().second.toString();
      eventLog.insert(0, prefix + "[" + time + "] " + msg);
      if (eventLog.length > 100) eventLog.removeLast();
    });
  }

  void shareLog() {
    if (eventLog.isEmpty) return;
    String fullLog = eventLog.join("\n");
    Share.share(fullLog, subject: 'Log Renga Race');
  }

  Future<void> testNativeCamera() async {
    try {
        addLog("TEST: Avvio ImagePicker...");
        final ImagePicker picker = ImagePicker();
        final XFile? photo = await picker.pickImage(source: ImageSource.camera);
        if (photo != null) {
            addLog("TEST OK: " + photo.path);
        } else {
            addLog("TEST: Annullato.");
        }
    } catch (e) {
        addLog("TEST ERROR: " + e.toString(), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, 
      body: SafeArea(
        child: Stack(
          children: [
            if (_isControllerInitialized)
              WebViewWidget(controller: _controller)
            else
              const Center(child: CircularProgressIndicator()),
             
            if (!isLogVisible)
              Positioned(
                bottom: 30, right: 20,
                child: FloatingActionButton(
                  backgroundColor: Colors.blue.withOpacity(0.6),
                  mini: true,
                  onPressed: () => setState(() => isLogVisible = true),
                  child: const Icon(Icons.bug_report, color: Colors.white),
                ),
              ),

            if (isLogVisible)
              Positioned.fill(
                child: Container(
                  color: Colors.black.withOpacity(0.95),
                  padding: const EdgeInsets.all(15),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("DIAGNOSTICA GOOGLE CORE", style: TextStyle(color: Colors.cyan, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 5),
                      Text(lastGpsStatus, style: const TextStyle(color: Colors.green)),
                      const Divider(color: Colors.white24),
                      Expanded(
                        child: ListView.builder(
                          itemCount: eventLog.length,
                          itemBuilder: (context, index) {
                            return Container(
                              margin: const EdgeInsets.symmetric(vertical: 2),
                              padding: const EdgeInsets.all(4),
                              child: Text(eventLog[index], style: TextStyle(color: Colors.white70, fontSize: 11, fontFamily: 'Courier')),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: testNativeCamera,
                              icon: const Icon(Icons.camera_alt, color: Colors.black),
                              label: const Text("TEST CAM", style: TextStyle(color: Colors.black)),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.yellow),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: shareLog,
                              icon: const Icon(Icons.share, color: Colors.white),
                              label: const Text("LOG", style: TextStyle(color: Colors.white)),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => setState(() => isLogVisible = false),
                              icon: const Icon(Icons.close, color: Colors.white),
                              label: const Text("X", style: TextStyle(color: Colors.white)),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
