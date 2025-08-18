document.addEventListener('DOMContentLoaded', () => {
    const userscontent = document.querySelector('.users-content');

    fetch('/get-users-db').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(users => {
        console.log('Users data fetched:', users);
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const encodedLogin = encodeURIComponent(user.login);
            const encodedPassword = encodeURIComponent(user.password);
            const userUrl = `/user-page?user=${encodedLogin}&password=${encodedPassword}`;

            const row = document.createElement('tr');
            row.classList.add('clickable-row');
            row.dataset.href = userUrl;

            row.innerHTML = `
                <td>${user.login}</td>
                <td>${user.password}</td>
                <td>${user.ip || 'none'}</td>
                <td>${user.isadmin?'Ja':'Nein'}</td>
            `;

            row.addEventListener('click', () => {
                window.location.href = userUrl;
            });

            userscontent.appendChild(row);
        }
    });
});
