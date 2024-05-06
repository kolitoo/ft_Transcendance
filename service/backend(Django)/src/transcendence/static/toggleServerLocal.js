function toggleServerLocal(element){
    if (!document.getElementById("queue_button")){
        element.checked = false;
        return;
    }
    if (element.checked){
        playEl = document.getElementById('play');
        if (playEl && playEl.classList.contains('show'))
            playEl.classList.remove('show');
        localPlayEl = document.getElementById('localPlay');
        if (localPlayEl && !localPlayEl.classList.contains('show'))
            localPlayEl.classList.add('show');
    }
    else {
        playEl = document.getElementById('play');
        if (playEl && !playEl.classList.contains('show'))
            playEl.classList.add('show');
        localPlayEl = document.getElementById('localPlay');
        if (localPlayEl && localPlayEl.classList.contains('show'))
            localPlayEl.classList.remove('show');
    }
}