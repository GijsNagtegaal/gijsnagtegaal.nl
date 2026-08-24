/**
 * ============================================================================
 * OBELINK RETOUR BOT - DIRECT LINK EDITIE 🚀 (DE DEFINITIEVE MIRAKL-FIX)
 * ============================================================================
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// ============================================================================
// 1. CONFIGURATIE & INSTELLINGEN
// ============================================================================
const TEST_MODUS = false; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEHEUGEN_BESTAND = path.join(__dirname, 'geheugen.json');
const RETURN_URL = "https://www.clicktoreturn.com/v2:d87cd76604cacfe0e273aa08cf7a0a49:253ddf083d3c8d3f0b8de59f9a023aaf3667f48a537711c7460b567df41c8258";

const CONFIG = {
    MIRAKL: {
        INBOX_URL: "https://marketplace-obelink.mirakl.net/api/inbox/threads?limit=50",
        ORDERS_URL: "https://marketplace-obelink.mirakl.net/api/orders",
        API_KEY: "b57a6ad1-2004-4dda-8f45-3576b563434f"
    },
    BOT: {
        CHECK_RETOUREN_INTERVAL_MS: 1 * 60 * 1000, 
        MAX_RETRIES: 3,                             
        RETRY_DELAY_MS: 2000,
        MAX_LEEFTIJD_UREN: 48 
    }
};

// ============================================================================
// 2. UTILITEITEN & LOGGING
// ============================================================================
const Kleuren = {
    Reset: "\x1b[0m", Helder: "\x1b[1m", Groen: "\x1b[32m", Geel: "\x1b[33m",
    Cyaan: "\x1b[36m", Rood: "\x1b[31m", Magenta: "\x1b[35m"
};

const Log = {
    info: (msg) => console.log(`${Kleuren.Cyaan}[INFO] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    succes: (msg) => console.log(`${Kleuren.Groen}${Kleuren.Helder}[SUCCES] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    waarschuwing: (msg) => console.log(`${Kleuren.Geel}[LET OP] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`),
    fout: (msg, err = "") => console.log(`${Kleuren.Rood}${Kleuren.Helder}[FOUT] ${new Date().toLocaleTimeString()} - ${msg} ${err}${Kleuren.Reset}`),
    test: (msg) => console.log(`${Kleuren.Magenta}[TESTMODUS] ${new Date().toLocaleTimeString()} - ${msg}${Kleuren.Reset}`)
};

// ============================================================================
// 3. BULLETPROOF FETCH
// ============================================================================
async function fetchMetRetry(url, opties, retries = CONFIG.BOT.MAX_RETRIES, isJson = false) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ...opties.headers
    };

    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); 

        try {
            const res = await fetch(url, { ...opties, headers, signal: controller.signal });
            
            if (!res.ok) {
                const errorBody = await res.text().catch(() => "");
                throw new Error(`Serverfout HTTP ${res.status}. Response: ${errorBody}`);
            }

            if (isJson) {
                const data = await res.json();
                clearTimeout(timeoutId); 
                return data; 
            }

            clearTimeout(timeoutId); 
            return res;

        } catch (error) {
            clearTimeout(timeoutId); 
            
            let errorMessage = error.message;
            if (error.name === 'AbortError' || error.type === 'aborted') {
                errorMessage = "Download van data duurde te lang (Timeout > 20s)";
            }

            if (i === retries - 1) {
                throw new Error(errorMessage);
            }
            
            Log.waarschuwing(`Netwerk hapering naar ${url.split('?')[0]} (${errorMessage}). Poging ${i + 2}/${retries}...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.BOT.RETRY_DELAY_MS));
        }
    }
}

// ============================================================================
// 4. GEHEUGEN BEHEER
// ============================================================================
class GeheugenBeheerder {
    static laad() {
        if (!fs.existsSync(GEHEUGEN_BESTAND)) {
            this.slaOp({});
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(GEHEUGEN_BESTAND, 'utf-8'));
        } catch (e) {
            return {};
        }
    }

    static slaOp(data) {
        fs.writeFileSync(GEHEUGEN_BESTAND, JSON.stringify(data, null, 4));
    }

    static voegToe(orderNummer, miraklThreadId) {
        const geheugen = this.laad();
        geheugen[orderNummer] = {
            mirakl_thread_id: miraklThreadId,
            status: "verzonden",
            verwerkt_op: new Date().toISOString()
        };
        this.slaOp(geheugen);
    }

    static isVerwerkt(orderNummer) {
        const geheugen = this.laad();
        return !!geheugen[orderNummer];
    }
}

// ============================================================================
// 5. BERICHT GENERATOR & EXTRA API CALLS
// ============================================================================
async function haalKlantEmailViaOrder(orderNr) {
    try {
        const data = await fetchMetRetry(`${CONFIG.MIRAKL.ORDERS_URL}?order_ids=${orderNr}`, {
            headers: { "Authorization": CONFIG.MIRAKL.API_KEY, "Accept": "application/json" }
        }, CONFIG.BOT.MAX_RETRIES, true);
        
        if (data && data.orders && data.orders.length > 0) {
            const order = data.orders[0];
            const klant = order.customer;
            
            // Pakt direct de lange Mirakl code, of een regulier e-mailadres als dat er toevallig is
            let email = order?.customer_notification_email || klant?.email || klant?.customer_email || null;

            return email;
        }
    } catch (e) {
        Log.waarschuwing(`Kon ordergegevens voor ${orderNr} niet ophalen. Reden: ${e.message}`);
    }
    return null;
}

function genereerKlantBericht(orderNr, klantNaam, klantEmail) {
    const uur = new Date().getHours();
    let groetNL = (uur >= 6 && uur < 12) ? "Goedemorgen" : (uur >= 12 && uur < 18) ? "Goedemiddag" : "Goedenavond";
    let groetEN = (uur >= 6 && uur < 12) ? "Good morning" : (uur >= 12 && uur < 18) ? "Good afternoon" : "Good evening";

    const isNederlands = orderNr.startsWith("2");
    const naamNL = klantNaam || "klant";
    const naamEN = klantNaam || "customer";
    
    // Als we écht geen email hebben, gebruiken we dit als uiterste fallback
    const emailTekst = klantEmail || "[Uw e-mailadres of Mirakl-code]";

    if (isNederlands) {
        return `${groetNL} ${naamNL},\n\nU kunt uw retour eenvoudig aanmelden en een retourlabel aanmaken via de volgende link:\n${RETURN_URL}\n\nVul daar de volgende gegevens in:\n- Ordernummer: ${orderNr}\n- E-mailadres: ${emailTekst}\n\nMet vriendelijke groet,\n\nGijs, Campline`;
    } else {
        return `${groetEN} ${naamEN},\n\nYou can easily register your return and create a return label using the following link:\n${RETURN_URL}\n\nPlease enter the following details:\n- Order number: ${orderNr}\n- Email address: ${emailTekst}\n\nKind regards,\n\nGijs, Campline`;
    }
}

// ============================================================================
// 6. HOOFDFUNCTIE: RETOUREN VERWERKEN & BERICHTEN STUREN
// ============================================================================
async function verwerkRetouren() {
    Log.info("=== 🔄 Controleren op nieuwe retouren via Mirakl ===");
    
    try {
        const miraklData = await fetchMetRetry(CONFIG.MIRAKL.INBOX_URL, { 
            headers: { "Authorization": CONFIG.MIRAKL.API_KEY, "Accept": "application/json" } 
        }, CONFIG.BOT.MAX_RETRIES, true);
        
        if (!miraklData || miraklData.errors || miraklData.error) {
            return Log.fout(`Mirakl API weigert aanvraag!`, JSON.stringify(miraklData.errors || "Geen data"));
        }

        let alleThreads = miraklData.data || miraklData.items || miraklData.threads || miraklData.collection || [];
        
        if (alleThreads.length === 0 && !Array.isArray(miraklData)) {
            for (const key of Object.keys(miraklData)) {
                if (Array.isArray(miraklData[key])) { alleThreads = miraklData[key]; break; }
            }
        }
        
        if (alleThreads.length === 0) return Log.info("💤 Geen berichten gevonden in de API response.");

        const nu = new Date();
        
        const retourThreads = alleThreads.filter(thread => {
            const threadDatum = new Date(thread.date_updated || thread.date_created);
            const urenOud = (nu - threadDatum) / (1000 * 60 * 60);
            if (urenOud > CONFIG.BOT.MAX_LEEFTIJD_UREN) return false;

            if (thread.status === 'CLOSED') return false;
            if (thread.has_unread_messages === false) return false; 

            const topic = thread.topic?.value?.toLowerCase() || thread.topic?.code?.toLowerCase() || "";
            return topic.includes("retour") || topic.includes("return") || topic.includes("rücksend");
        });

        if (retourThreads.length === 0) return Log.info(`💤 Geen RECENTE open retour-aanvragen gevonden (jonger dan 48 uur).`);

        let gevonden = 0;
        let nieuwVerwerkt = 0;

        for (const thread of retourThreads) {
            let orderNummer = "ONBEKEND";
            if (thread.entities && thread.entities.length > 0) orderNummer = thread.entities[0].id || thread.entities[0].label;
            
            if (orderNummer === "ONBEKEND") continue;
            
            gevonden++;

            if (GeheugenBeheerder.isVerwerkt(orderNummer)) continue;

            nieuwVerwerkt++;

            let klantNaam = null;
            let klantEmail = null;

            if (thread.customer?.firstname) klantNaam = thread.customer.firstname;
            else if (thread.customer?.name) klantNaam = thread.customer.name.split(" ")[0];
            
            if (!klantEmail && thread.participants) {
                const klant = thread.participants.find(p => p.type === 'CUSTOMER');
                if (klant?.email) {
                     klantEmail = klant.email;
                }
                if (!klantNaam && klant?.name) klantNaam = klant.name.split(" ")[0];
            }

            if (!klantEmail) {
                klantEmail = await haalKlantEmailViaOrder(orderNummer);
            }

            Log.info(`Nieuwe retour wordt klaargezet! Order: ${orderNummer}`);
            
            const dynamischBericht = genereerKlantBericht(orderNummer, klantNaam, klantEmail);

            if (TEST_MODUS) {
                Log.test(`[TEST] Bericht dat verzonden zou worden naar thread ${thread.id}:\n${dynamischBericht}\n`);
                GeheugenBeheerder.voegToe(orderNummer, thread.id);
                continue;
            }

            Log.info(`🚀 Bericht verzenden naar Mirakl Inbox voor order ${orderNummer}...`);
            
            // ----------------------------------------------------------------
            // HIER IS DE MAGIC FIX ✨ (Multipart Form Data met message_input)
            // ----------------------------------------------------------------
            const uploadUrl = `https://marketplace-obelink.mirakl.net/api/inbox/threads/${thread.id}/message`; 
            
            // 1. Maak de JSON data die Mirakl verwacht
            const payload = JSON.stringify({
                "to": [ { "type": "CUSTOMER" } ],
                "body": dynamischBericht
            });

            // 2. Bouw het 'formulier' op
            const form = new FormData();
            form.append('message_input', new Blob([payload], { type: 'application/json' }));

            // 3. Verzend het! (fetch regelt automatisch de form-data headers)
            const replyRes = await fetchMetRetry(uploadUrl, {
                method: "POST",
                headers: { 
                    "Authorization": CONFIG.MIRAKL.API_KEY, 
                    "Accept": "application/json"
                },
                body: form
            }, CONFIG.BOT.MAX_RETRIES, false); 

            if (replyRes && replyRes.ok) {
                Log.succes(`🎉 Return-link voor order ${orderNummer} succesvol naar de klant gestuurd!`);
                GeheugenBeheerder.voegToe(orderNummer, thread.id);
            } else {
                const errorText = replyRes ? await replyRes.text() : "Geen antwoord van server";
                Log.fout(`❌ Fout bij uploaden naar thread ${thread.id}:`, errorText);
            }
        }
        
        Log.succes(`Ronde voltooid! Totaal gevonden: ${gevonden}. Daarvan nieuw (nu verwerkt): ${nieuwVerwerkt}`);

    } catch (e) {
        Log.fout("Er trad een netwerk- of scriptfout op:", e.message);
    }
}

// ============================================================================
// 8. INITIALISATIE & RUNNER
// ============================================================================
async function startBotApplicatie() {
    console.clear();
    Log.info("==========================================================");
    Log.info("🚀 Obelink Direct-Link Retour Bot Opgestart!");
    if (TEST_MODUS) Log.waarschuwing("🚨 TESTMODUS IS AAN - Berichten worden NIET echt verstuurd!");
    Log.info("==========================================================\n");

    await verwerkRetouren();

    setInterval(async () => {
        await verwerkRetouren();
    }, CONFIG.BOT.CHECK_RETOUREN_INTERVAL_MS);
}

startBotApplicatie();