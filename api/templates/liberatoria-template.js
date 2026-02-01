// 🧬 TEMPLATE: Liberatoria Ufficiale Compilata (HTML)
export function generateLiberatoriaHTML(userData) {
    const oggi = new Date().toLocaleDateString('it-IT');

    return `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <style>
        @page { size: A4; margin: 2cm; }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        h1 { text-align: center; font-size: 18pt; margin-bottom: 30px; text-transform: uppercase; }
        h2 { font-size: 14pt; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        p { margin: 10px 0; text-align: justify; }
        .firma-box {
            margin-top: 50px;
            border: 2px solid #000;
            padding: 15px;
            min-height: 80px;
        }
        .firma-label { font-weight: bold; margin-bottom: 10px; }
        .dato-compilato {
            background: #ffffcc;
            font-weight: bold;
            padding: 2px 4px;
            border-bottom: 1px solid #333;
        }
        .checkbox { width: 15px; height: 15px; border: 2px solid #000; display: inline-block; margin-right: 8px; }
        .checkbox-checked { background: #000; }
        ul { margin: 15px 0; padding-left: 25px; }
        li { margin: 8px 0; }
        .intestazione { text-align: center; margin-bottom: 20px; border: 3px double #000; padding: 15px; }
        .footer { margin-top: 40px; font-size: 10pt; text-align: center; color: #666; }
        @media print {
            body { background: #fff; }
            .firma-box { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="intestazione">
        <h1>LIBERATORIA E CONSENSO INFORMATO</h1>
        <p style="margin:0;"><strong>RENGA TREFFEN 2026 - 2° Memorial Antonio Armellin</strong></p>
        <p style="margin:0; font-size:10pt;">Organizzato da MOTO CLUB PORTOGRUARESE SCUDERIA VENEZIA ASD</p>
    </div>

    <h2>§1. Dati Partecipante</h2>
    <p><strong>Nome Completo:</strong> <span class="dato-compilato">${userData.nome} ${userData.cognome}</span></p>
    <p><strong>Codice Fiscale:</strong> <span class="dato-compilato">${userData.codice_fiscale || 'N/A'}</span></p>
    <p><strong>Nato/a a:</strong> <span class="dato-compilato">${userData.citta_nascita || 'N/A'}</span></p>
    <p><strong>Residente in:</strong> <span class="dato-compilato">${userData.via_residenza || ''} ${userData.civico_residenza || ''}, ${userData.cap_residenza || ''} ${userData.citta_residenza || ''}</span></p>
    <p><strong>Telefono:</strong> <span class="dato-compilato">${userData.telefono}</span></p>
    <p><strong>Email:</strong> <span class="dato-compilato">${userData.email}</span></p>
    
    ${userData.secondo_nome ? `
    <p style="margin-top:15px;"><strong>Partner di Squadra:</strong> <span class="dato-compilato">${userData.secondo_nome} ${userData.secondo_cognome || ''}</span></p>
    <p><strong>Telefono Partner:</strong> <span class="dato-compilato">${userData.secondo_cellulare || 'N/A'}</span></p>
    ` : ''}

    <p><strong>Team:</strong> <span class="dato-compilato">${userData.team_name || 'N/A'}</span></p>
    <p><strong>Veicolo:</strong> <span class="dato-compilato">${userData.moto_details || 'N/A'}</span></p>
    <p><strong>Formula Partecipazione:</strong> <span class="dato-compilato">${userData.formula_partecipazione?.replace(/_/g, ' ') || 'N/A'}</span></p>

    <h2>§2. Dichiarazioni del Partecipante</h2>
    <p>Il/La sottoscritto/a, con la presente liberatoria:</p>
    <ul>
        <li><span class="${userData.understand_treasure_hunt === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>DICHIARA</strong> di essere a conoscenza che il Renga Treffen è una <strong>Caccia al Tesoro Motoristica</strong> e non una gara di velocità.</li>
        
        <li><span class="${userData.understand_team_of_2 === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>COMPRENDE</strong> che la partecipazione avviene <strong>esclusivamente in coppia</strong> (Team di 2 persone), salvo accordi particolari con l'organizzazione.</li>
        
        <li><span class="${userData.understand_knobby_tires === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>È CONSAPEVOLE</strong> che il percorso può includere tratti sterrati, sentieri e terreni non asfaltati, e che è fortemente consigliato l'uso di <strong>pneumatici tassellati</strong>.</li>
        
        <li><span class="${userData.understand_rain_or_shine === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>ACCETTA</strong> che l'evento si terrà con <strong>qualsiasi condizione meteorologica</strong> (pioggia, sole, nebbia, ecc.).</li>
        
        <li><span class="${userData.understand_donation_no_refund === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>RICONOSCE</strong> che la quota di iscrizione (€ <span class="dato-compilato">${userData.importo_dovuto || 0},00</span>) è una <strong>donazione libera non rimborsabile</strong> a sostegno dell'associazione.</li>
    </ul>

    <h2>§3. Esonero di Responsabilità</h2>
    <p>Il/La sottoscritto/a:</p>
    <ul>
        <li><strong>ESONERA</strong> il Moto Club Portogruarese Scuderia Venezia ASD, i suoi membri, organizzatori, volontari e sponsor da <strong>qualsiasi responsabilità</strong> per danni, infortuni, perdite o incidenti che possano verificarsi durante la partecipazione all'evento.</li>
        
        <li><strong>DICHIARA</strong> di partecipare volontariamente, consapevole dei rischi connessi alla guida fuoristrada e alla partecipazione ad eventi motoristici.</li>
        
        <li><strong>GARANTISCE</strong> di essere in possesso di patente di guida in corso di validità, documenti del veicolo regolari e copertura assicurativa RCA valida.</li>
        
        <li><strong>SI IMPEGNA</strong> a rispettare il Codice della Strada, il regolamento dell'evento e le indicazioni degli organizzatori.</li>
    </ul>

    <h2>§4. Tutela della Privacy e Trattamento Dati (GDPR)</h2>
    <p>Ai sensi del Regolamento UE 2016/679 (GDPR), il/la sottoscritto/a autorizza il trattamento dei propri dati personali per le finalità connesse all'organizzazione dell'evento, inclusa la comunicazione con i partecipanti.</p>
    
    <p><span class="${userData.authorize_media === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>AUTORIZZA</strong> l'utilizzo di foto, video e riprese effettuate durante l'evento per scopi promozionali, pubblicazioni e social media dell'associazione.</p>
    
    <p><span class="${userData.authorize_pilot_profile === 'SI' ? 'checkbox checkbox-checked' : 'checkbox'}"></span> <strong>ACCONSENTE</strong> alla pubblicazione del proprio profilo pilota (nome, foto, biografia) sul sito ufficiale e materiali promozionali.</p>

    <h2>§5. Contatto di Emergenza</h2>
    <p><strong>Persona da contattare in caso di emergenza:</strong> <span class="dato-compilato">${userData.emergency_contact_info || 'Non specificato'}</span></p>
    <p><strong>Telefono Emergenza:</strong> <span class="dato-compilato">${userData.emergency_contact_phone || 'Non specificato'}</span></p>
    ${userData.food_preferences ? `<p><strong>Allergie/Intolleranze:</strong> <span class="dato-compilato">${userData.food_preferences}</span></p>` : ''}

    <h2>§6. Firma e Data</h2>
    <p>Il/La sottoscritto/a dichiara di aver letto, compreso e accettato integralmente quanto sopra riportato.</p>
    
    <div class="firma-box">
        <div class="firma-label">Luogo e Data: <span class="dato-compilato">${userData.citta_residenza || '___________'}, ${oggi}</span></div>
        <div class="firma-label" style="margin-top:30px;">Firma del Partecipante: __________________________________________</div>
    </div>

    ${userData.secondo_nome ? `
    <div class="firma-box" style="margin-top:20px;">
        <div class="firma-label">Firma del Partner (${userData.secondo_nome} ${userData.secondo_cognome || ''}): __________________________________________</div>
    </div>
    ` : ''}

    <div class="footer">
        <p><strong>Documento generato automaticamente dal sistema di iscrizione Renga Treffen 2026</strong></p>
        <p>Per informazioni: info@rengatreffen.it | www.rengatreffen.it</p>
        <p style="font-size:8pt; margin-top:15px;">Moto Club Portogruarese Scuderia Venezia ASD - Via Roma 123, Portogruaro (VE)<br/>
        C.F. 12345678901 | Affiliato FMI</p>
    </div>
</body>
</html>
`;
}
