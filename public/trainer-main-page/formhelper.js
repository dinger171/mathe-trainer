function localStorageupdate() {
    fetch('/get-user')
        .then(response => response.json())
        .then(user => {
            console.log('User data fetched:', user);
            localStorage.setItem('user', JSON.stringify(user));

            const userinput = document.createElement('input');
            userinput.type = "hidden";
            userinput.id = "user";
            userinput.name = "user"; // чтобы отправлялось в форме

            // Устанавливаем строку JSON как значение
            userinput.value = JSON.stringify(user);

            document.querySelector('form').appendChild(userinput);
        })
        .catch(error => {
            console.error('Ошибка при получении данных пользователя:', error);
        });
}

setInterval(localStorageupdate, 3000)
