const titleEl = document.getElementById("song-title");
const artistEl = document.getElementById("song-artist");
const coverEl = document.getElementById("song-cover");
const timeEl = document.getElementById("song-duration");
const playBtn = document.querySelector(".songbtns #play");
const prevBtn = document.querySelector(".songbtns #prev");
const nextBtn = document.querySelector(".songbtns #next");
const pauseIcon = document.getElementById("pause-icon");
const container = document.querySelector(".cardContainer");
const songContainer = document.querySelector(".allList")
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");
const libraryList = document.querySelector(".library-list");
const volIcon = document.querySelector(".vol-icon");
const muteIcon = document.querySelector(".mute-icon");
const hamburgers = document.querySelectorAll(".hamburger");
const left = document.querySelector("main .left");
const close = document.querySelector(".close");
const volRange = document.querySelector(".range").
    getElementsByTagName("input")[0];
const loader = document.getElementById("loader");
const searchInput = document.querySelector("#searchbar");
const searchDropdown = document.querySelector(".searchDropdown");
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const audio = new Audio();
let currentSong = null;
let currentPlaylist = [];
let currentIndex = 0;
let songsData = {};
let allSongsData = null;
let allSongs = {};
let searchBase = []

// fetching songs



async function loadSongs() {
    try {
        const res = await fetch("data/songs.json");
        if (!res.ok) throw new Error("Failed to load songs");
        songsData = await res.json();
    } catch (err) {
        console.error(err);
    }
}

async function loadAllSongs() {
    try {
        const res = await fetch("assets/songs/All_Songs/info.json");
        if (!res.ok) throw new Error("Failed to load songs");
        allSongs = await res.json();
    } catch (err) {
        console.error(err);
    }
    allSongsData = allSongs.allSongs;
    searchBase = allSongs.allSongs.songs;

}

function loadPlaylist(songs) {
    libraryList.innerHTML = "";
    currentPlaylist = songs;
    currentIndex = 0;
    searchBase = songs;


    songs.forEach(song => {
        const row = createLibrarySong(song);
        libraryList.appendChild(row);
    });

    if (!songs.length) return;
    playSong(songs[0]);

}

function filterSongs(query) {
    query = query.toLowerCase();

    return searchBase.filter(songs =>
        songs.title.toLowerCase().includes(query) ||
        songs.artist.toLowerCase().includes(query)
    );
}

function renderFilteredSongs(filtered) {
    if (!Array.isArray(filtered)) {
        console.error("Filtered is not array:", filtered);
        return;
    }

    libraryList.innerHTML = "";

    if (filtered.length === 0) {
        libraryList.innerHTML = `<p style="padding:10px;">No songs found</p>`;
        return;
    }
    currentPlaylist = filtered;
    currentIndex = 0;
    filtered.forEach(song => {
        const row = createLibrarySong(song);
        libraryList.appendChild(row);
        if (window.innerWidth > 480) {

            left.classList.add("expanded");
        }
    });
}
function saveToRecentlyPlayed(song) {
    let recent = JSON.parse(localStorage.getItem("recentSongs")) || [];

    // remove duplicate
    recent = recent.filter(s => s.src !== song.src);

    // add to front
    recent.unshift(song);

    // limit to 6 songs
    recent = recent.slice(0, 6);

    localStorage.setItem("recentSongs", JSON.stringify(recent));
    renderRecentlyPlayed();
}



audio.volume = parseInt(volRange.value) / 100;

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    const progress = (audio.currentTime / audio.duration) * 100;

    circle.style.left = `${progress}%`

    timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`
})

audio.addEventListener("play", () => {
    playBtn.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
});

audio.addEventListener("pause", () => {
    pauseIcon.classList.add("hidden");
    playBtn.classList.remove("hidden");
});

audio.addEventListener("ended", () => {
    pauseIcon.classList.add("hidden");
    playBtn.classList.remove("hidden");
    nextBtn.click();
});

let lastVol = audio.volume || 0.5;
volRange.value = lastVol * 100;

function updateVolumeUI() {
    if (audio.volume === 0) {
        volIcon.classList.add("hidden");
        muteIcon.classList.remove("hidden");
    } else {
        volIcon.classList.remove("hidden");
        muteIcon.classList.add("hidden");
    }
}


function playSong(s) {
    if (audio.src !== s.src) {
        currentSong = s;
        audio.src = s.src;
        audio.currentTime = 0;
    }

    saveToRecentlyPlayed(s);
    audio.play();
    setActiveSongByIndex(currentIndex);

    titleEl.textContent = s.title;
    artistEl.textContent = s.artist;
    coverEl.src = s.cover;

}

function setActiveSongByIndex(index) {
    const allRows = document.querySelectorAll(".library-song");

    allRows.forEach(row => row.classList.remove("active"));

    if (allRows[index]) {
        allRows[index].classList.add("active");
    }
}


playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentSong) return;
    audio.play();
});
pauseIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.pause();
});

nextBtn.addEventListener("click", () => {
    if (!currentPlaylist.length) return;
    if (currentIndex < currentPlaylist.length - 1) {
        currentIndex++;
        playSong(currentPlaylist[currentIndex])

    }
})
prevBtn.addEventListener("click", () => {
    if (!currentPlaylist.length) return;
    if (currentIndex > 0) {
        currentIndex--;
        playSong(currentPlaylist[currentIndex])
    }
})




seekbar.addEventListener("click", (e) => {
    if (!audio.duration) return;

    const rect = seekbar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const percent = clickX / width;
    audio.currentTime = percent * audio.duration;
});

volIcon.addEventListener("click", () => {
    if (audio.volume > 0) {
        lastVol = audio.volume;
    }
    audio.volume = 0;
    volRange.value = 0;
    updateVolumeUI();
})

muteIcon.addEventListener("click", () => {

    volRange.value = lastVol * 100;
    audio.volume = lastVol;
    updateVolumeUI();

})

volRange.addEventListener("change", (e) => {
    const value = parseInt(e.target.value) / 100;
    audio.volume = value;
    if (value > 0) {
        lastVol = value;

    }
    updateVolumeUI();
})

hamburgers.forEach(hamburger => {
    hamburger.addEventListener("click", (e) => {
        e.stopPropagation();

        if (window.innerWidth <= 480) {
            left.classList.add("expanded");
        } else if (window.innerWidth <= 1024) {
            left.classList.toggle("expanded");
        }
    });
});
document.addEventListener("click", (e) => {

    if (window.innerWidth <= 768) {
        // check if click is OUTSIDE sidebar
        if (!left.contains(e.target) && !Array.from(hamburgers).some(h => h.contains(e.target))) {
            left.classList.remove("expanded");
        }
    }
});

close.addEventListener("click", (e) => {
    e.stopPropagation();
    left.classList.remove("expanded")
})

searchInput.addEventListener("input", (e) => {
    const query = e.target.value;

    if (!query.trim()) {
        renderFilteredSongs(searchBase);
        return;
    }

    const filtered = filterSongs(query);

    searchDropdown.innerHTML = "";
    if (filtered.length === 0) {
        searchDropdown.innerHTML = `<div class="searchItem">No results</div>`;
    } else {
        filtered.forEach(song => {
            const item = document.createElement("div");
            item.classList.add("searchItem");
            item.textContent = ""
            item.textContent = `${song.title} - ${song.artist}`;

            item.addEventListener("click", () => {
                playSong(song);
                searchDropdown.classList.add("hidden");
                searchInput.value = "";
            });

            searchDropdown.appendChild(item);
        });
    }

    searchDropdown.classList.remove("hidden");
    renderFilteredSongs(filtered);
});

searchInput.addEventListener("focus", () => {
    searchInput.style.outline = "1px solid #686a69";
    searchInput.style.background = "transparent !important";
});
searchInput.addEventListener("click", () => {

    if (window.innerWidth <= 480) {
        left.classList.add("expanded");

    }
});
searchInput.addEventListener("blur", () => {
    searchInput.style.outline = "none";
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        audio.paused ? audio.play() : audio.pause();
    }

    if (e.code === "ArrowRight") nextBtn.click();
    if (e.code === "ArrowLeft") prevBtn.click();
});

document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) {
        searchDropdown.classList.add("hidden");
    }
});

function createMoodCard(name) {

    const card = document.createElement("div");
    card.classList.add("card", "playlistCard");
    const firstSong = songsData[name][0];

    card.innerHTML = `
    <svg class="play " viewBox="0 0 24 24">
    <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"></path>
    </svg>
    <img src="${firstSong.cover}">
    <h3>${name.toUpperCase()}</h3>
    <p>${songsData[name].length} songs</p>
    `;

    card.addEventListener("click", (e) => {
        e.stopPropagation();
        document
            .querySelectorAll(".playlistCard")
            .forEach(c => c.classList.remove("active"));
        loadPlaylist(songsData[name]);
        card.classList.add("active");
        if (window.innerWidth > 480) {

            left.classList.add("expanded");
        }
    });
    return card

}

function createAllSongsCard() {

    const SongsCard = document.createElement("div");
    SongsCard.classList.add("card", "playlistCard");


    SongsCard.innerHTML = `
        <svg class="play " viewBox="0 0 24 24">
    <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606"></path>
    </svg>
        <img src="${allSongsData.cover}">
        <h3>${allSongsData.title.toUpperCase()}</h3>
        <p>${allSongsData.songs.length} songs</p>
    `;
    SongsCard.addEventListener("click", (e) => {
        e.stopPropagation();

        document
            .querySelectorAll(".playlistCard")
            .forEach(c => c.classList.remove("active"));
        loadPlaylist(allSongsData.songs);
        SongsCard.classList.add("active");

        if (window.innerWidth > 480) {
            left.classList.add("expanded");

        }
    });
    return SongsCard;

}

function createLibrarySong(song) {
    const row = document.createElement("div");
    row.classList.add("library-song")

    row.innerHTML = `
        <img class="invert-color" src="assets/Images/music.svg">
        <div class="info">
            <div>${song.title}</div>
            <div>${song.artist}</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert-color" src="assets/Images/playsong.svg">
        </div>
    `;
    const playnow = row.querySelector(".playnow")
    playnow.addEventListener("click", (e) => {
        e.stopPropagation();
        currentIndex = currentPlaylist.findIndex(
            s => s.src === song.src
        )
        playSong(song);
        setActiveSongByIndex(currentIndex);
    });

    return row;
}
function renderRecentlyPlayed() {
    const container = document.querySelector(".recentContainer");
    const recent = JSON.parse(localStorage.getItem("recentSongs")) || [];

    container.innerHTML = "";

    recent.forEach(song => {
        const card = document.createElement("div");
        card.classList.add("card", "playlistCard");

        card.innerHTML = `
            <img src="${song.cover}">
            <h3>${song.title}</h3>
            <p>${song.artist}</p>
        `;

        card.addEventListener("click", () => {
            currentPlaylist = recent;
            currentIndex = recent.findIndex(s => s.src === song.src);
            playSong(song);
        });

        container.appendChild(card);
    });
}

function renderMoodCards() {
    Object.keys(songsData).forEach(Mood => {
        container.appendChild(createMoodCard(Mood));
    });
}
function renderAllSongsCards() {
    songContainer.appendChild(createAllSongsCard());
}

async function init() {
    loader.style.display = "block"
    await loadSongs();
    await loadAllSongs();
    renderMoodCards();
    renderAllSongsCards();
    renderRecentlyPlayed();
    loader.style.display = "none"
}

init();
