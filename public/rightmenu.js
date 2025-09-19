console.log('rightmenu.js loaded');
let user = {}
function fetch_localstorage() {
    // Получение данных пользователя из localStorage
    user = JSON.parse(localStorage.getItem('user') || '{}');
}
fetch_localstorage()


// Создание элементов
const rightmenu = document.createElement('div');
const rightmenu_openbtn = document.createElement('button');
const rightmenu_closebtn = document.createElement('button');

// Назначение ID
rightmenu.id = 'rightmenu';
rightmenu_openbtn.id = 'rightmenu_openbtn';
rightmenu_closebtn.id = 'rightmenu_closebtn';

// Контент для кнопок
rightmenu_openbtn.innerHTML = `<span class="material-symbols-outlined">menu</span>`;
rightmenu_closebtn.textContent = 'schließen';

// Создание ссылки выхода
const logout = document.createElement('a');
logout.href = '/logout';
logout.textContent = 'Abmelden';
logout.id = 'logout';

// Добавление элементов в DOM
rightmenu.appendChild(rightmenu_closebtn);
rightmenu.appendChild(logout);
document.body.appendChild(rightmenu_openbtn);
document.body.appendChild(rightmenu);

// Добавление HTML (без удаления уже добавленных элементов)
rightmenu.insertAdjacentHTML('beforeend', `
    <h2 align='center' id="username">${user.login}</h2>

    <div class="switch-container">
        <span class="switch-label">Addition</span>
        <label class="switch">
            <input type="checkbox" id="addition-checkbox" checked/>
            <div class="slider round"></div>
        </label>
    </div>

    <div class="switch-container">
        <span class="switch-label">Subtraction</span>
        <label class="switch">
            <input type="checkbox" id="subtraction-checkbox" checked/>
            <div class="slider round"></div>
        </label>
    </div>

    <div class="switch-container">
        <span class="switch-label">Multiplication</span>
        <label class="switch">
            <input type="checkbox" id="multiplication-checkbox" checked/>
            <div class="slider round"></div>
        </label>
    </div>

    <div class="switch-container">
        <span class="switch-label">Division</span>
        <label class="switch">
            <input type="checkbox" id="division-checkbox" checked/>
            <div class="slider round"></div>
        </label>
    </div>
    <div id="qrcode"></div>
`);
// qrcode generation
let loginUrl = `http://${window.location.hostname}:3000/login-url?username=${encodeURIComponent(user.login)}&password=${encodeURIComponent(user.password)}`;

function generateqrcode() {
    fetch('/generate-qrcode?url=' + encodeURIComponent(loginUrl))
        .then(response => response.text())
        .then(data => {
            document.getElementById('qrcode').innerHTML = data;
        })
        .catch(error => console.error('Error fetching QR code:', error));
}
generateqrcode()

function update_rightmenu() {
    fetch_localstorage()
    loginUrl = `http://${window.location.hostname}:3000/login-url?username=${encodeURIComponent(user.login)}&password=${encodeURIComponent(user.password)}`;
    generateqrcode()

    // update display name
    document.getElementById('username').innerText = user.login
}
update_rightmenu()
setInterval(update_rightmenu,3000)

// Обработчики открытия и закрытия меню
rightmenu_openbtn.addEventListener('click', () => {
    rightmenu.style.right = '0';
    hover_audio.play(); // Play hover sound
});
rightmenu_closebtn.addEventListener('click', () => {
    rightmenu.style.right = '-25rem';
    console.log('rightmenu closed');
    hover_audio.play(); // Play hover sound
});

// Обновление состояния
function update_wanted_questions() {
    const isAdditionWanted = document.getElementById('addition-checkbox').checked;
    const isSubtractionWanted = document.getElementById('subtraction-checkbox').checked;
    const isMultiplicationWanted = document.getElementById('multiplication-checkbox').checked;
    const isDivisionWanted = document.getElementById('division-checkbox').checked;
    if (!isAdditionWanted && !isSubtractionWanted && !isMultiplicationWanted && !isDivisionWanted) {
        alert('Bitte mindestens eine Kategorie auswählen!');
        return;
    }

    fetch('/update-wanted-questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            addition: isAdditionWanted,
            subtraction: isSubtractionWanted,
            multiplication: isMultiplicationWanted,
            division: isDivisionWanted
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Update successful:', data);
    })
    .catch(error => {
        console.error('Error updating wanted questions:', error);
    });
    switch_audio.play(); // Play switch sound
}

// Добавление обработчиков событий
document.getElementById('addition-checkbox')?.addEventListener('change', update_wanted_questions);
document.getElementById('subtraction-checkbox')?.addEventListener('change', update_wanted_questions);
document.getElementById('multiplication-checkbox')?.addEventListener('change', update_wanted_questions);
document.getElementById('division-checkbox')?.addEventListener('change', update_wanted_questions);

// Установка начального состояния чекбоксов
fetch('/get-wanted-questions').then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}).then(data => {
    document.getElementById('addition-checkbox').checked = data.addition;
    document.getElementById('subtraction-checkbox').checked = data.subtraction;
    document.getElementById('multiplication-checkbox').checked = data.multiplication;
    document.getElementById('division-checkbox').checked = data.division;
}).catch(error => {
    console.error('Error fetching wanted questions:', error);
});