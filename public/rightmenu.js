console.log('rightmenu.js loaded');

// Получение данных пользователя из localStorage
const user = JSON.parse(localStorage.getItem('user') || '{}');

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
    <h2 align='center'>${user.login}</h2>

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
`);


// Обработчики открытия и закрытия меню
rightmenu_openbtn.addEventListener('click', () => {
    rightmenu.style.right = '0';
});
rightmenu_closebtn.addEventListener('click', () => {
    rightmenu.style.right = '-25rem';
    console.log('rightmenu closed');
});

// Обновление состояния
function update_wanted_questions() {
    const isAdditionWanted = document.getElementById('addition-checkbox').checked;
    const isSubtractionWanted = document.getElementById('subtraction-checkbox').checked;
    const isMultiplicationWanted = document.getElementById('multiplication-checkbox').checked;
    const isDivisionWanted = document.getElementById('division-checkbox').checked;

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