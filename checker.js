const fs = require('fs');

console.log("Start controle van real-time attractie- en parkdata via Queue-Times API...");

async function checkStoringen() {
    const endpoint = 'https://queue-times.com/parks/160/queue_times.json';

    try {
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

        // Maak een net object om op te slaan
        const outputData = {
            updated_at: new Date().toISOString(),
            storingen_count: storingenLijst.length,
            storingen: storingenLijst
        };

        // Schrijf de data weg naar storingen.json in de root van je project
        fs.writeFileSync('storingen.json', JSON.stringify(outputData, null, 2));
        console.log("✅ storingen.json succesvol gegenereerd met " + storingenLijst.length + " storing(en).");

        process.exit(0); 

    } catch (error) {
        console.error("❌ Fout tijdens het ophalen van de Queue-Times API:", error.message);
        process.exit(1); 
    }
}

checkStoringen();
