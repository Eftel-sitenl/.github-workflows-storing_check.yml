console.log("Start controle van real-time attractie- en parkdata via Queue-Times API...");

async function checkStoringen() {
    const endpoint = 'https://queue-times.com/parks/160/queue_times.json';
    
    // Jouw jsonbin.io gegevens (vul hier jouw Bin ID in)
    const BIN_ID = '6a6dc181f5f4af5e29dd650d';
    const API_KEY = process.env.JSONBIN_API_KEY; // Wordt veilig ingelezen vanuit GitHub Secrets

    try {
        // 1. Haal de data op van Queue-Times
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

        const outputData = {
            updated_at: new Date().toISOString(),
            storingen_count: storingenLijst.length,
            storingen: storingenLijst
        };

        // 2. Stuur de schone data door naar jsonbin.io
        console.log("Gegevens doorsturen naar jsonbin.io...");
        const jsonBinResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(outputData)
        });

        if (!jsonBinResponse.ok) {
            throw new Error(`Fout bij opslaan op jsonbin.io: ${jsonBinResponse.status}`);
        }

        console.log("✅ jsonbin.io succesvol geüpdatet met " + storingenLijst.length + " storing(en).");
        process.exit(0); 

    } catch (error) {
        console.error("❌ Fout tijdens het uitvoeren:", error.message);
        process.exit(1); 
    }
}

checkStoringen();
