/**
 * ============================================================================
 * OBELINK RETOUR & LABEL BOT - ENTERPRISE EDITIE (WATERDICHTE VERSIE)
 * ============================================================================
 * Dit script controleert Mirakl op retour-aanvragen, maakt automatisch
 * tickets aan in Supabase (Verzendbazen), en stuurt PDF-labels terug naar de 
 * klant zodra deze in de juiste map zijn geplaatst.
 * ============================================================================
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// 1. CONFIGURATIE & INSTELLINGEN
// ============================================================================
// 🚨 ZET DIT OP FALSE ALS JE KLAAR BENT MET TESTEN EN ECHT WILT VERZENDEN 🚨
const TEST_MODUS = false; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEHEUGEN_BESTAND = path.join(__dirname, 'geheugen.json');
const BUCKET_NAME = "ticket-attachments";

const CONFIG = {
    SUPABASE: {
        URL: "https://pmdwbormhrtmzzmxrpea.supabase.co",
        API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZHdib3JtaHJ0bXp6bXhycGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NDg3MDMsImV4cCI6MjA4OTUyNDcwM30.DhrdMuUipZ_GDA6nlGzaCBhmmo33vKKaSJuHmsm0FY0",
        EMAIL: "boekhouding@aedontrading.nl",
        WACHTWOORD: "bybbac-xuvqiC-8tixfi"
    },
    MIRAKL: {
        URL: "https://marketplace-obelink.mirakl.net/api/inbox/threads",
        API_KEY: "b57a6ad1-2004-4dda-8f45-3576b563434f"
    },
    BOT: {
        CHECK_RETOUREN_INTERVAL_MS: 1 * 60 * 1000,  // Elke 1 minuut checken
        CHECK_LABELS_INTERVAL_MS: 1 * 60 * 1000,    // Elke 1 minuut labels zoeken
        MAX_RETRIES: 3,                             // Hoe vaak een mislukte API call opnieuw proberen
        RETRY_DELAY_MS: 2000                        // Wachttijd tussen retries
    }
};

// ============================================================================
// 2. UTILITEITEN & LOGGING (KLEUREN IN TERMINAL)
// ============================================================================
const Kleuren = {
    Reset: "\x1b[0m",
    Helder: "\x1b[1m",
    Groen: "\x1b[32m",
    Geel: "\x1b[33m",
    Blauw: "\x1b[34m",
    Magenta: "\x1b[35m",
    Cyaan: "\x1b[36m",
    Rood: "\x1b[31m"
};

const Log = {
    info: (msg) => console.log(`${Kleuren.Cyaan}[INFO] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    succes: (msg) => console.log(`${Kleuren.Groen}${Kleuren.Helder}[SUCCES] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    waarschuwing: (msg) => console.log(`${Kleuren.Geel}[LET OP] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    fout: (msg, err = "") => console.log(`${Kleuren.Rood}${Kleuren.Helder}[FOUT] ${new Date().toLocaleTimeString()} - ${msg} ${err}${Kleuren.Reset}`),
    test: (msg) => console.log(`${Kleuren.Magenta}[TESTMODUS] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`)
};

/**
 * Voert een API fetch uit, maar probeert het opnieuw als het mislukt (retry logic).
 */
async function fetchMetRetry(url, opties, retries = CONFIG.BOT.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, opties);
            if (!res.ok && res.status >= 500) {
                throw new Error(`Serverfout ${res.status}`);
            }
            return res;
        } catch (error) {
            if (i === retries - 1) throw error;
            Log.waarschuwing(`Netwerk hapering (${error.message}). Poging ${i + 2}/${retries} over ${CONFIG.BOT.RETRY_DELAY_MS}ms...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.BOT.RETRY_DELAY_MS));
        }
    }
}

// ============================================================================
// 3. GEHEUGEN BEHEER (Lokaal opslaan van statussen)
// ============================================================================
class GeheugenBeheerder {
    static laad() {
        if (!fs.existsSync(GEHEUGEN_BESTAND)) {
            Log.info("Geen bestaand geheugenbestand gevonden. Er wordt een nieuwe aangemaakt.");
            this.slaOp({});
            return {};
        }
        try {
            const data = fs.readFileSync(GEHEUGEN_BESTAND, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            Log.fout("Fout bij lezen geheugenbestand, we beginnen met een schone lei.", e.message);
            return {};
        }
    }

    static slaOp(data) {
        try {
            fs.writeFileSync(GEHEUGEN_BESTAND, JSON.stringify(data, null, 4));
        } catch (e) {
            Log.fout("Kan geheugen niet opslaan!", e.message);
        }
    }

    static voegToe(orderNummer, ticketId, miraklThreadId) {
        const geheugen = this.laad();
        geheugen[orderNummer] = {
            ticket_id: ticketId,
            mirakl_thread_id: miraklThreadId,
            status: "wacht_op_label",
            aangemaakt_op: new Date().toISOString(),
            bijgewerkt_op: new Date().toISOString()
        };
        this.slaOp(geheugen);
    }

    static markeerAlsVerzonden(orderNummer) {
        const geheugen = this.laad();
        if (geheugen[orderNummer]) {
            geheugen[orderNummer].status = "verzonden";
            geheugen[orderNummer].bijgewerkt_op = new Date().toISOString();
            this.slaOp(geheugen);
        }
    }
}

// ============================================================================
// 4. SUPABASE DIENSTEN (Backend connecties)
// ============================================================================
class SupabaseService {
    static async getToken() {
        const res = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email: CONFIG.SUPABASE.EMAIL, password: CONFIG.SUPABASE.WACHTWOORD })
        });
        
        const data = await res.json();
        if (!data.access_token) throw new Error("Geen geldig access token ontvangen van Supabase.");
        return data.access_token;
    }

    static async controleerOfTicketBestaat(token, orderNummer) {
        const res = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/rest/v1/tickets?order_number=eq.${orderNummer}&select=id,ticket_number`, {
            method: "GET",
            headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}` }
        });
        return await res.json();
    }

    static async genereerNieuwTicketNummer(token) {
        const res = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/rest/v1/rpc/next_ticket_number`, {
            method: "POST",
            headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: "{}"
        });
        const ruwNummer = await res.text();
        return ruwNummer.replace(/^"|"$/g, '').trim(); 
    }

    /**
     * ZOEKT AUTOMATISCH NAAR EEN GELDIG ID IN DE DATABASE
     * Dit voorkomt Foreign Key fouten (zoals category_id constraint fouten).
     */
    static async haalEersteIdOp(token, tabellenNamen) {
        for (const tabel of tabellenNamen) {
            try {
                const res = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/rest/v1/${tabel}?select=id&limit=1`, {
                    method: "GET",
                    headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) return data[0].id; // Eerste de beste geldige ID
                }
            } catch (e) {
                // Negeer fouten, probeer de volgende tabelnaam
            }
        }
        return null;
    }

    static async maakTicketAan(token, ticketNummer, orderNummer) {
        // AUTOMATISCH GELDIGE IDs ZOEKEN!
        const autoCategoryId = await this.haalEersteIdOp(token, ["categories", "ticket_categories", "category"]);
        const autoStatusId = await this.haalEersteIdOp(token, ["statuses", "ticket_statuses", "status"]) || "st-1";
        const autoCustomerId = await this.haalEersteIdOp(token, ["customers", "users"]) || "84608f8a-9435-4ce8-ac0f-b9f6115d8416";

        if (autoCategoryId) Log.info(`🤖 Auto-detectie: category_id gevonden -> ${autoCategoryId}`);
        
        // Bouw de data op voor het nieuwe ticket
        const ticketData = {
            "ticket_number": ticketNummer,
            "order_number": orderNummer,
            "description": `Graag een retourlabel voor ${orderNummer}`,
            "status_id": autoStatusId,
            "customer_id": autoCustomerId
        };

        // Voeg category_id alleen toe als we er eentje hebben gevonden
        if (autoCategoryId) {
            ticketData.category_id = autoCategoryId;
        }

        const res = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/rest/v1/tickets?select=*`, {
            method: "POST",
            headers: { 
                "apikey": CONFIG.SUPABASE.API_KEY, 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json", 
                "Prefer": "return=representation" 
            },
            body: JSON.stringify(ticketData)
        });
        
        const data = await res.json();

        // Vang database- en validatiefouten van Supabase netjes af
        if (!res.ok || data.error || data.code) {
            throw new Error(`Supabase weigerde de insert. Reden: ${data.message || JSON.stringify(data)}`);
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
            throw new Error("Fout bij wegschrijven: geen data teruggekregen van de database.");
        }

        return Array.isArray(data) ? data[0] : data;
    }
}

// ============================================================================
// 5. HOOFDFUNCTIE 1: RETOUREN OPHALEN & TICKETS AANMAKEN
// ============================================================================
async function stap1_CheckNieuweRetouren() {
    Log.info("=== 🔄 STAP 1: Controleren op nieuwe retouren via Mirakl ===");
    
    try {
        const miraklRes = await fetchMetRetry(CONFIG.MIRAKL.URL, { 
            headers: { "Authorization": CONFIG.MIRAKL.API_KEY, "Accept": "application/json" } 
        });
        
        if (!miraklRes.ok) {
            Log.fout(`Kan Mirakl niet bereiken (HTTP ${miraklRes.status}). Controleer je API-key!`);
            return;
        }

        const miraklData = await miraklRes.json();
        const alleThreads = miraklData.data || miraklData.items || miraklData.threads || [];

        if (alleThreads.length === 0) {
            return Log.waarschuwing("De inbox in Mirakl is volledig leeg.");
        }

        const retourThreads = alleThreads.filter(thread => {
            const topic = thread.topic?.value?.toLowerCase() || "";
            return topic.includes("retour") || topic.includes("return") || topic.includes("rücksend");
        });

        // Sorteer op datum (nieuwste eerst)
        retourThreads.sort((a, b) => new Date(b.date_updated || b.date_created) - new Date(a.date_updated || a.date_created));

        if (retourThreads.length === 0) {
            return Log.info("💤 Geen nieuwe retourberichten gevonden.");
        }

        const meestRecenteThread = retourThreads[0];
        let orderNummer = "ONBEKEND";
        
        if (meestRecenteThread.entities && meestRecenteThread.entities.length > 0) {
            orderNummer = meestRecenteThread.entities[0].id || meestRecenteThread.entities[0].label;
        }

        Log.info(`Meest recente retour gevonden! Order: ${orderNummer}`);

        let geheugen = GeheugenBeheerder.laad();
        if (geheugen[orderNummer]) {
            if (geheugen[orderNummer].status === "verzonden") {
                return Log.waarschuwing(`⏩ Order ${orderNummer} staat al op verzonden in ons systeem.`);
            } else {
                return Log.waarschuwing(`⏩ Order ${orderNummer} is al bekend en wacht op een label.`);
            }
        }

        const token = await SupabaseService.getToken();
        const bestaandeTickets = await SupabaseService.controleerOfTicketBestaat(token, orderNummer);

        let ticketId;

        if (bestaandeTickets && bestaandeTickets.length > 0) {
            const ticket = bestaandeTickets[0];
            ticketId = ticket.id;
            Log.succes(`Ticket voor order ${orderNummer} bestaat al in de database (TicketNr: ${ticket.ticket_number}).`);
        } else {
            Log.info(`Geen ticket gevonden voor ${orderNummer}. Nieuwe aanmaken...`);
            const nieuwTicketNummer = await SupabaseService.genereerNieuwTicketNummer(token);
            const nieuwTicket = await SupabaseService.maakTicketAan(token, nieuwTicketNummer, orderNummer);
            ticketId = nieuwTicket.id;
            Log.succes(`✅ Nieuw ticket succesvol aangemaakt! ID: ${ticketId}`);
        }

        GeheugenBeheerder.voegToe(orderNummer, ticketId, meestRecenteThread.id);
        Log.succes(`💾 Order ${orderNummer} is opgeslagen in geheugen om op een label te wachten.`);

    } catch (e) {
        Log.fout("Er trad een fout op tijdens Stap 1:", e.message);
    }
}

// ============================================================================
// 6. HOOFDFUNCTIE 2: LABELS ZOEKEN (WATERDICHT) EN VERZENDEN
// ============================================================================
async function zoekLabelWaterdicht(token, orderNr) {
    // 1. Haal LIVE alle tickets op die aan deze order gekoppeld zijn
    const ticketsRes = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/rest/v1/tickets?order_number=eq.${orderNr}&select=id,ticket_number`, {
        method: "GET",
        headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}` }
    });
    
    const gekoppeldeTickets = await ticketsRes.json();

    if (!gekoppeldeTickets || gekoppeldeTickets.length === 0) {
        return null; 
    }

    // 2. Doorzoek de opslagmappen van AL deze tickets
    for (const ticket of gekoppeldeTickets) {
        const filesRes = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/storage/v1/object/list/${BUCKET_NAME}`, {
            method: "POST",
            headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ prefix: `${ticket.id}/`, limit: 10 })
        });
        
        const bestandenLijst = await filesRes.json();
        const echteBestanden = Array.isArray(bestandenLijst) ? bestandenLijst.filter(f => f.id) : [];

        if (echteBestanden.length > 0) {
            const gevondenBestand = echteBestanden[0]; 
            Log.info(`💡 Label gevonden in map van ticket ${ticket.ticket_number} (${ticket.id})`);
            
            return { 
                pad: `${ticket.id}/${gevondenBestand.name}`, 
                bestandsNaam: gevondenBestand.name 
            };
        }
    }

    return null;
}

// HULPFUNCTIE: BOUW HET BERICHT OP BASIS VAN TIJD EN ORDER
function genereerKlantBericht(orderNr, klantNaam = null) {
    const uur = new Date().getHours();
    let groetNL, groetEN;

    // Tijd bepalen (Morgen / Middag / Avond)
    if (uur >= 6 && uur < 12) {
        groetNL = "Goedemorgen";
        groetEN = "Good morning";
    } else if (uur >= 12 && uur < 18) {
        groetNL = "Goedemiddag";
        groetEN = "Good afternoon";
    } else {
        groetNL = "Goedenavond";
        groetEN = "Good evening";
    }

    // Is het Nederlands? (Begint orderNr met een 2?)
    const isNederlands = orderNr.startsWith("2");

    // Stel de naam in (als we geen naam hebben, gebruik 'klant' / 'customer')
    const naamNL = klantNaam ? klantNaam : "klant";
    const naamEN = klantNaam ? klantNaam : "customer";

    // Bouw het daadwerkelijke bericht
    if (isNederlands) {
        return `${groetNL} ${naamNL},\n\nHierbij uw retourlabel, deze is 5 dagen geldig.\n\nMet vriendelijke groet,\n\nGijs, Campline`;
    } else {
        return `${groetEN} ${naamEN},\n\nHere is your return label, it is valid for 5 days.\n\nKind regards,\n\nGijs, Campline`;
    }
}

async function stap2_VerwerkEnVerzendLabels() {
    Log.info("\n=== 📤 STAP 2: Controleren of er labels klaarstaan om te verzenden ===");
    
    try {
        const geheugen = GeheugenBeheerder.laad();
        const teDoen = Object.keys(geheugen).filter(orderNr => geheugen[orderNr].status === "wacht_op_label");

        if (teDoen.length === 0) {
            return Log.info("💤 Er zijn momenteel geen tickets die wachten op een verzendlabel.");
        }

        const token = await SupabaseService.getToken();

        for (const orderNr of teDoen) {
            const data = geheugen[orderNr];
            Log.info(`🔍 Zoeken naar label voor order ${orderNr}...`);

            const labelData = await zoekLabelWaterdicht(token, orderNr);

            if (!labelData) {
                Log.waarschuwing(`⚠️ Nog geen label-bestand gevonden voor order ${orderNr}. We wachten af.`);
                continue; 
            }

            Log.succes(`✅ Bestand "${labelData.bestandsNaam}" gevonden! Bezig met downloaden...`);

            const pdfRes = await fetchMetRetry(`${CONFIG.SUPABASE.URL}/storage/v1/object/authenticated/${BUCKET_NAME}/${labelData.pad}`, {
                method: "GET",
                headers: { "apikey": CONFIG.SUPABASE.API_KEY, "Authorization": `Bearer ${token}` }
            });
            
            if (!pdfRes.ok) throw new Error(`Download van Supabase mislukt met HTTP ${pdfRes.status}`);

            const arrayBuffer = await pdfRes.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);
            
            Log.info(`📥 PDF succesvol gedownload. Grootte: ${(pdfBuffer.length / 1024).toFixed(2)} KB.`);

            // DYNAMISCH BERICHT GENEREREN!
            const dynamischBericht = genereerKlantBericht(orderNr, data.klant_naam);

            Log.info(`🚀 Upload voorbereiden voor Mirakl Thread ID: ${data.mirakl_thread_id}...`);
            const form = new FormData();
            form.append("message_input", JSON.stringify({ 
                "to": [ { "type": "CUSTOMER" } ],
                "body": dynamischBericht
            }), { contentType: 'application/json' });
            
            form.append("files", pdfBuffer, { 
                filename: labelData.bestandsNaam, 
                contentType: "application/pdf" 
            });

            // DE TESTMODUS SCHAKELAAR
            if (TEST_MODUS) {
                Log.test("=========================================================================");
                Log.test(`TESTMODUS IS ACTIEF!`);
                Log.test(`Actie: Verzoek sturen naar Mirakl`);
                Log.test(`Gegenereerd bericht:\n${dynamischBericht}`);
                Log.test(`-> TEST_MODUS staat aan, dus upload naar klant is geannuleerd.`);
                Log.test("=========================================================================");
                continue; 
            }

            // ECHT VERZENDEN NAAR MIRAKL
            Log.info("Uploading naar Mirakl... Let op, dit gaat naar de klant!");
            const replyRes = await fetchMetRetry(`${CONFIG.MIRAKL.URL}/${data.mirakl_thread_id}/messages`, {
                method: "POST",
                headers: { "Authorization": CONFIG.MIRAKL.API_KEY, ...form.getHeaders() },
                body: form
            });

            if (replyRes.ok) {
                Log.succes(`🎉 BOOM! Label voor order ${orderNr} is succesvol naar de klant gestuurd via Mirakl!`);
                GeheugenBeheerder.markeerAlsVerzonden(orderNr);
            } else {
                Log.fout(`❌ Fout bij uploaden naar Mirakl:`, await replyRes.text());
            }
        }
    } catch (e) {
        Log.fout("Er trad een fout op tijdens Stap 2:", e.message);
    }
}

// ============================================================================
// 7. INITIALISATIE & RUNNER
// ============================================================================
async function startBotApplicatie() {
    console.clear();
    Log.info("==========================================================");
    Log.info("🚀 AedonTrading / Obelink Mirakl Bot is Opgestart!");
    Log.info(`📍 Geheugen locatie: ${GEHEUGEN_BESTAND}`);
    if (TEST_MODUS) Log.waarschuwing("🚨 TESTMODUS IS AAN - Berichten worden NIET echt verstuurd naar klanten!");
    Log.info("==========================================================\n");

    await stap1_CheckNieuweRetouren();
    await stap2_VerwerkEnVerzendLabels();

    setInterval(async () => {
        await stap1_CheckNieuweRetouren();
    }, CONFIG.BOT.CHECK_RETOUREN_INTERVAL_MS);

    setInterval(async () => {
        await stap2_VerwerkEnVerzendLabels();
    }, CONFIG.BOT.CHECK_LABELS_INTERVAL_MS);
    
    Log.info(`⏳ Intervals ingesteld op 1 minuut. Bot draait nu op de achtergrond...`);
}

// ============================================================================
// 8. LET'S GO!
// ============================================================================
startBotApplicatie();