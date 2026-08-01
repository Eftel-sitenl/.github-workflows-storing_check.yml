const fs = require('fs');

console.log("Start controle van real-time attractie- en parkdata via Queue-Times API...");

async function checkStoringen() {
    const endpoint = 'https://queue-times.com/parks/160/queue_times.json';
    
    // Jouw jsonbin.io gegevens
    const BIN_ID = '6a6c9bc0f5f4af5e29d9f1d5';
    const API_KEY = process.env.JSONBIN_API_KEY; // Wordt veilig ingelezen vanuit GitHub Secrets

    try {
        // 1. Haal de actuele data op van Queue-Times
        const response = await fetch(endpoint, {
            headers: {
                'User-Agent': 'Eftel-site-checker/1.0 (Contact: admin@eftel-site.nl)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server weigert de verbinding: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let storingenLijst = [];

        // Data parsen (identiek aan je parklogica)
        if (data.lands && Array.isArray(data.lands)) {
            data.lands.forEach(land => {
                if (land.rides && Array.isArray(land.rides)) {
                    land.rides.forEach(ride => {
                        if (ride.is_open === false) {
                            storingenLijst.push({
                                name: ride.name,
                                wait_time: ride.wait_time || 0,
                                last_updated: new Date().toISOString()
                            });
                        }
                    });
                }
            });
        }
        
        if (data.rides && Array.isArray(data.rides)) {
            data.rides.forEach(ride => {
                if (ride.is_open === false && !storingenLijst.some(item => item.name === ride.name)) {
                    storingenLijst.push({
                        name: ride.name,
                        wait_time: ride.wait_time || 0,
                        last_updated: new Date().toISOString()
                    });
                }
            });
        }

        // Huidige datum voor het logboek
        const huidigeDatumStr = new Date().toISOString().split('T')[0];
        const actUur = new Date().getHours() + (new Date().getMinutes() / 60);

        // 2. Haal eerst de bestaande logboekdata op uit jsonbin.io om de geschiedenis niet te overschrijven
        let bestaandLogboek = {};
        try {
            const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
                headers: { "X-Master-Key": API_KEY }
            });
            if (getRes.ok) {
                const existingData = await getRes.json();
                if (existingData && existingData.record && existingData.record.storingsLogBoek) {
                    if (existingData.record.storingsLogBoek.datum === huidigeDatumStr) {
                        bestaandLogboek = existingData.record.storingsLogBoek.logboek || {};
                    }
                }
            }
        } catch (e) {
            console.warn("Kon bestaand logboek niet inlezen, start met een schone lei.", e.message);
        }

        // 3. Update het logboek op basis van de actuele storingen
        storingenLijst.forEach(storing => {
            let attractieNaam = storing.name;
            if (!bestaandLogboek[attractieNaam]) {
                bestaandLogboek[attractieNaam] = [];
            }
            let sessies = bestaandLogboek[attractieNaam];
            let laatsteSessie = sessies[sessies.length - 1];

            if (!laatsteSessie || laatsteSessie.eind !== null) {
                sessies.push({ start: Number(actUur.toFixed(2)), eind: null });
            }
        });

        // Sluit actieve storingen die inmiddels zijn opgelost
        Object.keys(bestaandLogboek).forEach(attractieNaam => {
            let stillInStore = storingenLijst.some(s => s.name === attractieNaam);
            let sessies = bestaandLogboek[attractieNaam];
            if (sessies && sessies.length > 0) {
                let laatsteSessie = sessies[sessies.length - 1];
                if (!stillInStore && laatsteSessie && laatsteSessie.eind === null) {
                    laatsteSessie.eind = Number(actUur.toFixed(2));
                }
            }
        });

        // 4. Bouw het totale object op voor jsonbin.io
        const payload = {
            updated_at: new Date().toISOString(),
            storingen_count: storingenLijst.length,
            storingen: storingenLijst,
            storingsLogBoek: {
                datum: huidigeDatumStr,
                logboek: bestaandLogboek
            }
        };

        // 5. Stuur de data door naar jsonbin.io via een PUT request
        console.log("Gegevens doorsturen naar jsonbin.io...");
        const jsonBinResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!jsonBinResponse.ok) {
            throw new Error(`Fout bij opslaan op jsonbin.io: ${jsonBinResponse.status}`);
        }

        console.log("✅ jsonbin.io succesvol geüpdatet! Aantal storingen: " + storingenLijst.length);
        process.exit(0); 

    } catch (error) {
        console.error("❌ Fout tijdens het uitvoeren:", error.message);
        process.exit(1); 
    }
}

checkStoringen();
