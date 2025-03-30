let data = [];
let currentIndex = 0;
let bannedArtists = [];
let bannedWords = []

async function banArtist() {
    let currentArtist = data[currentIndex]["Channel Name"];
    if (bannedArtists.includes(currentArtist)) {
        return false;
    }
    bannedArtists.push(currentArtist);
    await applyAutoClassificationRules();
    await sortOptimaly();
    await setCurrentIndex();
    await showNext();
}

async function setCurrentIndex() {
    currentIndex = data.findIndex(x => x["Is Music"] == null)
}

async function displayStats() {
    let music = data.filter(x => x["Is Music"] == true).length;
    let notMusic = data.filter(x => x["Is Music"] == false).length;
    let unknown = data.filter(x => x["Is Music"] == null).length;
    document.getElementById('status-music').innerText = music;
    document.getElementById('status-not-music').innerText = notMusic;
    document.getElementById('status-unknown').innerText = unknown;
}

async function sortOptimaly() {
    data = data.sort((a, b) => {
        if (a["Is Music"] == null && b["Is Music"] != null) return -1;
        if (b["Is Music"] == null && a["Is Music"] != null) return 1;

        const aHasMusic = Array.isArray(a["Categories"]) && a["Categories"].includes('https://en.wikipedia.org/wiki/Music');
        const bHasMusic = Array.isArray(b["Categories"]) && b["Categories"].includes('https://en.wikipedia.org/wiki/Music');

        if (aHasMusic && !bHasMusic) return -1;
        if (bHasMusic && !aHasMusic) return 1;

        return 0;
    });
}

async function askAI() {
    try {
        const video = data[currentIndex];
        const body = {
            title: video.Title,
            description: video.Description,
            categories: video.Categories,
            duration: video.Duration,
        }
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        return (result.prediction * 100).toFixed(2);
    } catch (error) {
        console.error('API call failed:', error);
        return 'API unavailable';
    }
}

async function autoDecide(video) {
    lowercaseTitle = video.Title.toLowerCase();
    lowercaseArtist = video["Channel Name"].toLowerCase();
    bannedArtists = bannedArtists.map(x => x.toLowerCase());
    bannedWords = bannedWords.map(x => x.toLowerCase());
    if (bannedArtists.includes(lowercaseArtist)) {
        return false
    }
    if (bannedWords.some(x => lowercaseTitle.includes(x)) || bannedWords.some(x => lowercaseArtist.includes(x))) {
        return false;
    }
    if (video["Channel Name"].includes("- Topic")) {
        return true;
    }
    return undefined;
}

async function showNext() {
    displayStats();
    let ai = askAI();
    let next = data[currentIndex];

    document.getElementById('current-image').src = `https://img.youtube.com/vi/${next.ID}/hqdefault.jpg`
    document.getElementById('current-title').innerText = next.Title;
    document.getElementById('current-artist').innerText = next["Channel Name"];
    let aiResult = await ai;
    document.getElementById('current-prediction').innerText = aiResult + "%";
    if (aiResult > 50) {
        document.getElementById('current-prediction').style.color = "green";
    }
    else {
        document.getElementById('current-prediction').style.color = "red";
    }
}

async function loadDatabaseContent() {
    try {
        data = await window.electronAPI.readDatabase();
    } catch (error) {
        console.error('Failed to load database:', error);
    }
}

async function saveDatabaseContent() {
    try {
        await window.electronAPI.writeDatabase(data);
    } catch (error) {
        console.error('Failed to save database:', error);
    }
}

async function revert() {
    currentIndex--;
    data[currentIndex]["Is Music"] = null;
    showNext();
}

async function skipForNow() {
    setCurrentIndex();
    showNext();
}

async function getNextIndex() {
    return data.findIndex(x => x["Is Music"] == null);
}

function handleKeystroke(event) {
    if (event.key === 'ArrowRight') {
        data[currentIndex]["Is Music"] = false;
        setCurrentIndex();
        showNext();
    }
    if (event.key === 'ArrowLeft') {
        data[currentIndex]["Is Music"] = true;
        setCurrentIndex();
        showNext();
    }
    if (event.key === 'ArrowUp') {
        revert();
    }
    if (event.key === 'ArrowDown') {
        skipForNow();
    }
}

async function applyAutoClassificationRules() {
    for (const v of data) {
        if (v["Is Music"] != null) {
            continue;
        }
        const result = autoDecide(v);
        if (result != null) {
            v["Is Music"] = await result;
        }
    }
}

async function main() {
    await loadDatabaseContent()
    await applyAutoClassificationRules();
    await sortOptimaly();
    await setCurrentIndex();
    await showNext();
    setInterval(saveDatabaseContent, 5000);
    document.addEventListener('keydown', handleKeystroke);
}

main();
