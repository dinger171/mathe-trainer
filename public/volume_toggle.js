const volumeToggle = document.createElement('button');
volumeToggle.id = 'volume_toggle_button';

// если в localStorage ничего нет, по умолчанию включаем звук
if (localStorage.getItem("volumeToggle") === null) {
    localStorage.setItem("volumeToggle", "true");
}

function updateVolume() {
    const isVolumeOn = localStorage.getItem("volumeToggle") === "true";

    // Иконка
    volumeToggle.innerHTML = isVolumeOn
        ? `<span class="material-symbols-outlined">volume_up</span>`
        : `<span class="material-symbols-outlined">volume_off</span>`;

    // Громкость
    switch_audio.volume  = isVolumeOn ? 1 : 0;
    start_audio.volume   = isVolumeOn ? 1 : 0;
    correct_audio.volume = isVolumeOn ? 1 : 0;
}

volumeToggle.addEventListener('click', () => {
    const isVolumeOn = localStorage.getItem("volumeToggle") === "true";
    localStorage.setItem("volumeToggle", String(!isVolumeOn));
    updateVolume();
});

document.body.appendChild(volumeToggle);

// Первичная установка состояния
updateVolume();
