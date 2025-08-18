document.addEventListener('DOMContentLoaded', () => {
    const historycontent = document.querySelector('.history-content');

    fetch('/get-user').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(user => {
        console.log('User data fetched:', user);
        for (let i = user.history.length; i > 0; i--) {
            const item = user.history[i - 1];
                historycontent.innerHTML += `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleString()}</td>
                    <td>${JSON.stringify(item.question).replaceAll('"', '')}</td>
                </tr>
            `;
        }
    })
})