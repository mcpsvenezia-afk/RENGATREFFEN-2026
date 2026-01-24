<?php
/**
 * Script di gestione iscrizioni Renga Treffen 2026
 * Ottimizzato per hosting Aruba
 */

// Imposta la risposta come JSON
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Sanificazione dati
    $team_name = filter_var($_POST['team_name'], FILTER_SANITIZE_STRING);
    $p1_name   = filter_var($_POST['p1_name'], FILTER_SANITIZE_STRING);
    $p1_email  = filter_var($_POST['p1_email'], FILTER_SANITIZE_EMAIL);
    $p2_name   = filter_var($_POST['p2_name'], FILTER_SANITIZE_STRING);
    $p2_email  = filter_var($_POST['p2_email'], FILTER_SANITIZE_EMAIL);
    $moto      = filter_var($_POST['moto'], FILTER_SANITIZE_STRING);
    $phone     = filter_var($_POST['phone'], FILTER_SANITIZE_STRING);

    // 2. Destinatario (la tua email)
    $to = "renga.treffen@gmail.com"; 
    $subject = "NUOVA ISCRIZIONE: Team " . $team_name;

    // 3. Costruzione del messaggio
    $message = "Hai ricevuto una nuova richiesta di iscrizione dal sito Renga Treffen.\n\n";
    $message .= "--- DETTAGLI TEAM ---\n";
    $message .= "Nome Team: " . $team_name . "\n";
    $message .= "Moto: " . $moto . "\n";
    $message .= "Telefono Referente: " . $phone . "\n\n";
    
    $message .= "--- PILOTA 1 (Responsabile) ---\n";
    $message .= "Nome: " . $p1_name . "\n";
    $message .= "Email: " . $p1_email . "\n\n";

    $message .= "--- PILOTA 2 ---\n";
    $message .= "Nome: " . $p2_name . "\n";
    $message .= "Email: " . $p2_email . "\n\n";
    
    $message .= "Data invio: " . date("d/m/Y H:i:s") . "\n";

    // 4. Intestazioni (Fondamentali per ARUBA)
    // NOTA: 'From' deve essere un indirizzo esistente sul tuo dominio Aruba
    // Sostituisci 'noreply@iltuodominio.it' con un'email reale del tuo dominio una volta online.
    $domain = $_SERVER['HTTP_HOST'];
    $from_email = "iscrizioni@" . $domain;
    
    $headers = "From: Renga Treffen <" . $from_email . ">\r\n";
    $headers .= "Reply-To: " . $p1_email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // 5. Invio
    if (mail($to, $subject, $message, $headers)) {
        echo json_encode(["status" => "success", "message" => "Iscrizione inviata con successo!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Errore nell'invio dell'email via server."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Metodo non consentito."]);
}
?>
