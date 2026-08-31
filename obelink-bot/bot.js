/**
 * ============================================================================
 * OBELINK RETOUR BOT - DIRECT LINK EDITIE 🚀 (MET ORDER-API FIX & ANTI-HANG)
 * ============================================================================
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// 1. CONFIGURATIE & INSTELLINGEN
// ============================================================================
const TEST_MODUS = true; 

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEHEUGEN_BESTAND = path.join(__dirname, 'geheugen.json');
const RETURN_URL = "https://www.clicktoreturn.com/v2:d87cd76604cacfe0e273aa08cf7a0a49:253ddf083d3c8d3f0b8de59f9a023aaf3667f48a537711c7460b567df41c8258";

const CONFIG = {
    MIRAKL: {
        INBOX_URL: "https://marketplace-obelink.mirakl.net/api/inbox/threads",
        ORDERS_URL: "https://marketplace-obelink.mirakl.net/api/orders",
        API_KEY: "b57a6ad1-2004-4dda-8f45-3576b563434f"
    },
    BOT: {
        CHECK_RETOUREN_INTERVAL_MS: 1 * 60 * 1000, 
        MAX_RETRIES: 3,                             
        RETRY_DELAY_MS: 2000                        
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
// 🛡️ BULLETPROOF FETCH (Voorkomt ECONNRESET en vastlopen)
// ============================================================================
async function fetchMetRetry(url, opties, retries = CONFIG.BOT.MAX_RETRIES) {
    // 1. Voeg standaard altijd een User-Agent toe zodat de firewall ons niet blokkeert
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...opties.headers
    };

    for (let i = 0; i < retries; i++) {
        // 2. Maak een AbortController aan om een vastgelopen verbinding na 15 sec af te breken
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch(url, { 
                ...opties, 
                headers, 
                signal: controller.signal // Koppel het afbreek-signaal aan de fetch
            });
            
            clearTimeout(timeoutId); // Verzoek is geslaagd, stop de timeout timer

            if (!res.ok && res.status >= 500) throw new Error(`Serverfout ${res.status}`);
            return res;

        } catch (error) {
            clearTimeout(timeoutId); // Zorg dat de timer ook stopt bij een fout
            
            let errorMessage = error.message;
            if (error.name === 'AbortError') errorMessage = "Verbinding duurde te lang (Timeout)";

            if (i === retries - 1) throw new Error(errorMessage);
            Log.waarschuwing(`Netwerk hapering (${errorMessage}). Poging ${i + 2}/${retries}...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.BOT.RETRY_DELAY_MS));
        }
    }
}

// ============================================================================
// 3. GEHEUGEN BEHEER
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
// 4. BERICHT GENERATOR & EXTRA API CALLS
// ============================================================================
async function haalKlantEmailViaOrder(orderNr) {
    try {
        const res = await fetchMetRetry(`${CONFIG.MIRAKL.ORDERS_URL}?order_ids=${orderNr}`, {
            headers: { "Authorization": CONFIG.MIRAKL.API_KEY, "Accept": "application/json" }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.orders && data.orders.length > 0 && data.orders[0].customer) {
                return data.orders[0].customer.email || null;
            }
        }
    } catch (e) {
        Log.waarschuwing(`Kon ordergegevens voor ${orderNr} niet ophalen.`);
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
    
    const emailTekst = klantEmail || "[Uw e-mailadres waarmee u besteld heeft]";

    if (isNederlands) {
        return `${groetNL} ${naamNL},\n\nU kunt uw retour eenvoudig aanmelden en een retourlabel aanmaken via de volgende link:\n${RETURN_URL}\n\nVul daar de volgende gegevens in:\n- Ordernummer: ${orderNr}\n- E-mailadres: ${emailTekst}\n\nMet vriendelijke groet,\n\nGijs, Campline`;
    } else {
        return `${groetEN} ${naamEN},\n\nYou can easily register your return and create a return label using the following link:\n${RETURN_URL}\n\nPlease enter the following details:\n- Order number: ${orderNr}\n- Email address: ${emailTekst}\n\nKind regards,\n\nGijs, Campline`;
    }
}

// ============================================================================
// 5. HOOFDFUNCTIE: RETOUREN VERWERKEN & BERICHTEN STUREN
// ============================================================================
async function verwerkRetouren() {
    Log.info("=== 🔄 Controleren op nieuwe retouren via Mirakl ===");
    
    try {
        const miraklRes = await fetchMetRetry(CONFIG.MIRAKL.INBOX_URL, { 
            headers: { "Authorization": CONFIG.MIRAKL.API_KEY, "Accept": "application/json" } 
        });
        
        if (!miraklRes.ok) return Log.fout(`Kan Mirakl niet bereiken (HTTP ${miraklRes.status}).`);

        const miraklData = await miraklRes.json();
        const alleThreads = miraklData.data || miraklData.items || miraklData.threads || [];
        
        const retourThreads = alleThreads.filter(thread => {
            const topic = thread.topic?.value?.toLowerCase() || "";
            return topic.includes("retour") || topic.includes("return") || topic.includes("rücksend");
        });

        if (retourThreads.length === 0) return Log.info("💤 Geen nieuwe retourberichten gevonden.");

        retourThreads.sort((a, b) => new Date(a.date_updated || a.date_created) - new Date(b.date_updated || b.date_created));

        for (const thread of retourThreads) {
            let orderNummer = "ONBEKEND";
            if (thread.entities && thread.entities.length > 0) {
                orderNummer = thread.entities[0].id || thread.entities[0].label;
            }

            if (orderNummer === "ONBEKEND") continue;
            if (GeheugenBeheerder.isVerwerkt(orderNummer)) continue;

            let klantNaam = null;
            let klantEmail = null;

            if (thread.customer?.firstname) klantNaam = thread.customer.firstname;
            else if (thread.customer?.name) klantNaam = thread.customer.name.split(" ")[0];
            else if (thread.customer_name) klantNaam = thread.customer_name.split(" ")[0];

            if (thread.customer?.email) klantEmail = thread.customer.email;
            else if (thread.customer_email) klantEmail = thread.customer_email;
            
            if (!klantEmail && thread.participants) {
                const klant = thread.participants.find(p => p.type === 'CUSTOMER' || p.role === 'CUSTOMER');
                if (klant?.email) klantEmail = klant.email;
                if (!klantNaam && klant?.name) klantNaam = klant.name.split(" ")[0];
            }

            if (!klantEmail) {
                klantEmail = await haalKlantEmailViaOrder(orderNummer);
            }

            Log.info(`Nieuwe retour gevonden! Order: ${orderNummer} | Email: ${klantEmail || "NIET GEVONDEN IN ORDER API"}`);
            
            const dynamischBericht = genereerKlantBericht(orderNummer, klantNaam, klantEmail);

            if (TEST_MODUS) {
                Log.test(`Bericht dat verzonden zou worden naar thread ${thread.id}:\n\n${dynamischBericht}\n`);
                GeheugenBeheerder.voegToe(orderNummer, thread.id);
                continue;
            }

            Log.info(`🚀 Bericht verzenden naar Mirakl Inbox...`);
            const uploadUrl = `${CONFIG.MIRAKL.INBOX_URL}/${thread.id}/message`;

            const replyRes = await fetchMetRetry(uploadUrl, {
                method: "POST",
                headers: { 
                    "Authorization": CONFIG.MIRAKL.API_KEY, 
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "to": [ { "type": "CUSTOMER" } ],
                    "body": dynamischBericht
                })
            });

            if (replyRes.ok) {
                Log.succes(`🎉 Return-link voor order ${orderNummer} succesvol naar de klant gestuurd!`);
                GeheugenBeheerder.voegToe(orderNummer, thread.id);
            } else {
                const errorText = await replyRes.text();
                Log.fout(`❌ Fout bij uploaden (HTTP ${replyRes.status}):`, errorText);
            }
        }
    } catch (e) {
        Log.fout("Er trad een fout op:", e.message);
    }
}

// ============================================================================
// 6. INITIALISATIE & RUNNER
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