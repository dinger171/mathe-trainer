const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { type } = require('os');
const PORT = process.env.PORT || 3000;
const QRCode = require('qrcode');


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function sanitize(input) {
    if (typeof input !== 'string') return '';
    return input
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}


app.get('/', (req, res) => {
    const clientIp = req.ip;
    if (isAuthenticated(clientIp) && isadmin(clientIp)) {
        res.sendFile(path.join(__dirname, 'public/admin-panel', 'index.html'));
    } else if (isAuthenticated(clientIp)) {
        res.sendFile(path.join(__dirname, 'public/trainer-main-page', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public/login-page', 'index.html'));
    }
});

app.get('/questions', (req, res) => {
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(req.ip));
    const wantedQuestions = user.wantedQuestions || {
        addition: true,
        subtraction: true,
        multiplication: true,
        division: true
    };

    if (!user) {
        return res.status(401).send('Пользователь не найден.');
    }

    // Получаем оригинальные уровни пользователя
    const originalLevels = { ...user.levels };

    // Сортируем от минимального к максимальному
    let sortedLevels = Object.entries(originalLevels)
        .sort((a, b) => a[1] - b[1]);

    // Выбираем два случайных индекса в массиве
    const i = Math.floor(Math.random() * sortedLevels.length);
    let j = Math.floor(Math.random() * sortedLevels.length);
    while (j === i) j = Math.floor(Math.random() * sortedLevels.length); // чтобы j ≠ i

    // Меняем местами два элемента
    [sortedLevels[i], sortedLevels[j]] = [sortedLevels[j], sortedLevels[i]];

    // Преобразуем обратно в объект
    let resultLevels = Object.fromEntries(sortedLevels);

    for (const key in resultLevels) {
        if (!wantedQuestions[key]) {
            delete resultLevels[key];
        }
    }


    console.log("Levels (with noise):", resultLevels);
    res.json(resultLevels);
});

app.post('/questions-feedback', (req, res) => {
    const { type, time } = req.body;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(req.ip));

    if (!user) {
        return res.status(401).send('Пользователь не найден.');
    }

    // Обновляем уровень по типу
    if (time < 120) {
        user.levels[type] += 1;
    }
    console.log(time)

    user.history.push({
        timestamp: new Date().toISOString(),
        levels: { ...user.levels },
        question: req.body.question,
        time: time,
    });

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
    res.send('Feedback saved successfully.');
});



app.post('/trainer-start', (req, res) => {
    console.log('Form data:', req.body); // For example: { buttonName: 'start' }

    // You can redirect to another page, or send a response
    res.sendFile(path.join(__dirname, 'public/trainer-training-page', 'index.html'));
});

app.post('/auth', (req, res) => {
    const clientIp = req.ip;

    let users = [];
    try {
        if (fs.existsSync('users.json')) {
            users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        }
    } catch (err) {
        console.error('Ошибка при чтении файла:', err);
    }

    // Проверка, уже авторизован ли IP
    if (users.some(entry => entry.ip.includes(clientIp) && entry.ip == Array)) {
        return res.send('Вы уже авторизованы.');
    }

    const { username, password } = req.body;

    // Сценарий: логин
    const existingUser = users.find(entry => entry.login === sanitize(username) && entry.password === sanitize(password));
    if (existingUser) {
        // Добавляем IP к существующему пользователю
        if (!existingUser.ip.includes(clientIp)) {
            existingUser.ip.push(clientIp);
        }
    } else {
        // Сценарий: регистрация
        const userinfo = {
            login: username,
            password: password,
            ip: [clientIp],
            school: '',
            class: '',
            levels: {
                addition: 0,
                subtraction: 0,
                multiplication: 0,
                division: 0
            },
            history: []
        };
        // sanitize
        userinfo.login = sanitize(userinfo.login);
        userinfo.password = sanitize(userinfo.password)
        // too long username or password
        if (userinfo.login.length > 20 || userinfo.password.length > 20) {
            return res.send('name oder kennword ist zu lang (max 20 zeichen)<script>setTimeout(function() {window.location.href = "/"},3000)</script>').status(400);
        } else {
            // Добавляем нового пользователя
            users.push(userinfo);
        }
    }
    try {
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
        res.redirect('/')
    } catch (err) {
        console.error('Ошибка при записи файла:', err);
        res.status(500).send('Ошибка сервера.');
    }
});

app.get('/login-url', (req, res) => { // for qr code login
    let users = [];
    try {
        if (fs.existsSync('users.json')) {
            users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        }
    } catch (err) {
        console.error('Ошибка при чтении файла:', err);
    }

    const clientIp = req.ip;

    let username = sanitize(req.query.username);
    let password = sanitize(req.query.password);
    const existingUser = users.find(entry => entry.login == username && entry.password == password);
    console.log(existingUser)
    if (existingUser) {
        // Добавляем IP к существующему пользователю
        existingUser.ip.push(clientIp);
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
        return res.redirect('/');
    } else {
        return res.status(401).send('User not found.');
    }
});

app.get('/get-user', (req, res) => {
    const clientIp = req.ip;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(clientIp));
    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found.');
    }
});

app.get('/get-rankings', (req, res) => {
    const top = req.query.top; // Number of top users to return
    const type = req.query.type || 'all';
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(req.ip));
    let rankings = [];
    if (type === 'all') {
        rankings = users.map(user => ({
            name: user.login,
            score: Object.values(user.levels).reduce((a, b) => a + b, 0),
            isyou: user.ip.includes(req.ip) ? true : false,
            isrankhidden: user.isrankhidden || false,
        }));
    } else {
        rankings = users.map(user => ({
            name: user.login,
            score: user.levels[type] || 0,
            isyou: user.ip.includes(req.ip) ? true : false,
            isrankhidden: user.isrankhidden || false,
        }));
    }
    // Filter out users with isrankhidden set to true
    rankings = rankings.filter(entry => !entry.isrankhidden);

    rankings.sort((a, b) => b.score - a.score); // Sort by score descending
    if (top === 'all') {
        res.json(rankings);
        return;
    } else {
        res.json(rankings.slice(0, top)); // Return top N users
    }
});

app.post('/update-wanted-questions', (req, res) => {
    const { addition, subtraction, multiplication, division } = req.body;
    const clientIp = req.ip;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(clientIp));
    let isValid = false;
    for (const type in req.body) {// Validate input
        if (typeof req.body[type] !== 'boolean') {
            return res.status(400).send(`Invalid value for ${type}. Expected boolean.`);
        }
        if (req.body[type] == true && isValid == false) {
            isValid = true;
        }
    }
    if (!isValid) {
        return res.status(400).send('At least one question type must be selected.');
    }
    if (user) {
        user.wantedQuestions = {
            addition,
            subtraction,
            multiplication,
            division
        };
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
        res.send('Wanted questions updated successfully.');
    } else {
        res.status(404).send('User not found.');
    }
});

app.get('/get-wanted-questions', (req, res) => {
    const clientIp = req.ip;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(clientIp));
    if (user && user.wantedQuestions) {
        res.json(user.wantedQuestions);
    } else {
        res.status(404).send('User or wanted questions not found.');
    }
});

// qrcode generator route
app.get('/generate-qrcode', (req, res) => {
    if (isAuthenticated(req.ip)) {
        const url = req.query.url; // keep as string!

        if (!url) {
            return res.status(400).send('Missing url parameter');
        }

        QRCode.toDataURL(url, {scale: 10}, (err, src) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error generating QR');
            }

            res.send(`<img src="${src}" alt="QR Code">`);
        });
    } else {
        res.status(403).send('Forbidden');
    }
});

app.post('/update-user-password', (req, res) => {
    const clientIp = req.ip;

    if (!isAuthenticated(clientIp)) {
        return res.status(403).send('Not authorized');
    }

    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));

    const username = req.query.username;
    const oldPassword = req.query.oldpassword;
    const newPassword = req.query.newpassword;

    // ищем юзера
    let user = users.find(entry => entry.ip.includes(clientIp));

    // если админ, можно менять чужой пароль
    if (isadmin(clientIp)) {
        user = users.find(entry => entry.login === username);
    }

    if (!user) {
        return res.status(404).send('User not found');
    }

    if ((user.login === username && user.password === oldPassword) || isadmin(clientIp)) {
        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).send('Invalid new password');
        }

        user.password = sanitize(newPassword);

        fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
        return res.send({ success: true, message: 'Password updated successfully!' });
    } else {
        return res.status(403).send('Wrong credentials');
    }
});


// Admin panel routes
app.get('/get-users-db', (req, res) => {
    const clientIp = req.ip;
    if (isAuthenticated(clientIp) && isadmin(clientIp)) {
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'))
        res.send(users)
    } else {
        res.sendStatus(403, 'NOT AUTHERIZED/ADMIN')
    }
})

app.get('/user-page', (req, res) => {
    const clientIp = req.ip;
    if (isAuthenticated(clientIp) && isadmin(clientIp)) {
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        const serchedUser = users.find(entry => entry.login === req.query.user && entry.password === req.query.password);
        if (serchedUser) {
            res.send(`
                <html>
                <head>
                    <title>Nutzer Seite</title>
                    <!--website icon-->
                    <link rel="icon" href="favicon.png" type="image/x-icon">
                    <link rel="stylesheet" href="./admin-panel/user-controll.css">
                    <link rel="favicon" href="./favicon.png" type="image/x-icon">
                </head>
                <body>
                    <button onclick="window.location.href='/';" id="backbutton">Zurück</button>
                    <header>
                        <h1>Nutzer Seite</h1>
                    </header>
                    <div class="user-info">
                        <h2 id='login'>Name: ${serchedUser.login}</h2>
                        <p>kennwort: <input id="passwordinput" type="text" value="${serchedUser.password}"></p>
                        <p>IP: ${serchedUser.ip.join(', ') || 'none'}</p>
                        <p>
                            <div class="switch-container">
                                <span class="switch-label">Admin</span>
                                <label class="switch">
                                    <input type="checkbox" id="admin-checkbox" ${serchedUser.isadmin ? "checked" : ""} />
                                    <div class="slider round"></div>
                                </label>
                            </div>
                        </p>
                        <p>
                            <div class="switch-container">
                                <span class="switch-label">Rang verstecken</span>
                                <label class="switch">
                                    <input type="checkbox" id="rankhidden-checkbox" ${serchedUser.isrankhidden ? "checked" : ""} />
                                    <div class="slider round"></div>
                                </label>
                            </div>
                        </p>

                        <p>Ebenen: <br> addieren: <input value="${serchedUser.levels.addition}" id="additionLevelInput" type="number"><br> subtrachieren: <input value="${serchedUser.levels.subtraction}" id="subtractionLevelInput" type="number"><br>multiplication: <input value="${serchedUser.levels.multiplication}" id="multiplicationLevelInput" type="number"><br>dividieren: <input value="${serchedUser.levels.division}" id="divisionLevelInput" type="number"></p>
                        <p>History: <p id="history"></p></p>
                    </div>
                    <script>
                    const additionInput = document.getElementById('additionLevelInput');
                    const subtractionInput = document.getElementById('subtractionLevelInput');
                    const multiplicationInput = document.getElementById('multiplicationLevelInput');
                    const divisionInput = document.getElementById('divisionLevelInput');

                    const adminCheckbox = document.getElementById('admin-checkbox');
                    const rankHiddenCheckbox = document.getElementById('rankhidden-checkbox');

                    const passwordInput = document.getElementById('passwordinput');

                    function sanitize(input) {
                        if (typeof input !== 'string') return '';
                        return input
                            .replaceAll('<', '&lt;')
                            .replaceAll('>', '&gt;')
                            .replaceAll('"', '&quot;')
                            .replaceAll("'", '&#39;');
                    }

                    passwordInput.addEventListener('change', () => {
                        const newPassword = encodeURIComponent(sanitize(passwordInput.value));

                        fetch("/update-user-password?username=" + encodeURIComponent("${serchedUser.login}") +
                            "&oldpassword=" + encodeURIComponent("${serchedUser.password}") +
                            "&newpassword=" + newPassword, {
                            method: 'POST'
                        })
                        .then(response => {
                            if (response.ok) {
                                console.log('Password updated successfully!');
                                window.location.href = '/user-page?user=' + encodeURIComponent(sanitize("${serchedUser.login}")) +
                                '&password=' + newPassword;
                            } else {
                                console.log('Failed to update password.');
                            }
                        });
                    });


                    function updateLevels() {
                        const levels = {
                            addition: Number(additionInput.value),
                            subtraction: Number(subtractionInput.value),
                            multiplication: Number(multiplicationInput.value),
                            division: Number(divisionInput.value)
                        };
                        fetch('/update-user-levels', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user: '${serchedUser.login}', password: '${serchedUser.password}', levels })
                        }).then(response => {
                            if (response.ok) {
                                console.log('succsess')
                            } else {
                                alert('Failed to update levels.');
                            }
                        });
                    }

                    additionInput.addEventListener('change', updateLevels);
                    subtractionInput.addEventListener('change', updateLevels);
                    multiplicationInput.addEventListener('change', updateLevels);
                    divisionInput.addEventListener('change', updateLevels);

                    function updateUserAdminStatus() {
                        const isadmin = adminCheckbox.checked;
                        fetch('/update-user-admin-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user: '${serchedUser.login}', password: '${serchedUser.password}', isadmin })
                        }).then(response => {
                            if (response.ok) {
                                console.log('Admin status updated successfully!');
                                setTimeout(() => {
                                   window.location.href = '/' 
                                }, 500);
                            } else {
                                console.log('Failed to update admin status.');
                            }
                        });
                    }
                    adminCheckbox.addEventListener('change', updateUserAdminStatus);

                    function updateUserRankHiddenStatus() {
                        const isrankhidden = rankHiddenCheckbox.checked;
                        fetch('/update-user-rank-hidden-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user: '${serchedUser.login}', password: '${serchedUser.password}', isrankhidden })
                        }).then(response => {
                            if (response.ok) {
                                console.log('Rank hidden status updated successfully!');
                            } else {
                                console.log('Failed to update rank hidden status.');
                            }
                        });
                    }
                    rankHiddenCheckbox.addEventListener('change', updateUserRankHiddenStatus);
                    // history
                    const historyElement = document.getElementById('history');
                    const historyData = ${JSON.stringify(serchedUser.history)};
                    if (historyData.length === 0) {
                        historyElement.innerText = 'Benutzer hat keine aufgaben gemacht.';
                    } else {
                        for (let i = historyData.length; i > 0; i--) {
                            const entry = historyData[i - 1];
                            const entryElement = document.createElement('div');
                            entryElement.classList.add('history-entry');
                            entryElement.innerHTML = '<strong>' + new Date(entry.timestamp).toLocaleString() + '</strong><br>' +
                                'Frage: ' + entry.question + '<br>' +
                                'Zeit gebraucht: ' + entry.time + ' Sekunden<br><hr>';
                            historyElement.appendChild(entryElement);
                        }
                    }
                </script>

                    </body>
                    </html>
                `)
        } else {
            res.status(404).send('User not found.');
        }
    }
})


app.post('/update-user-levels', (req, res) => {
    if (isAuthenticated(req.ip) && isadmin(req.ip)) {
        const login = req.body.user;
        const password = req.body.password;
        const addition = req.body.levels.addition;
        const subtraction = req.body.levels.subtraction;
        const multiplication = req.body.levels.multiplication;
        const division = req.body.levels.division;
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        const serchedUser = users.find(entry => entry.login === login && entry.password === password);
        if (typeof addition === "number" && typeof subtraction === "number" && typeof multiplication === "number" && typeof division === "number") {
            if (serchedUser) {
                serchedUser.levels = {
                    addition: addition,
                    subtraction: subtraction,
                    multiplication: multiplication,
                    division: division
                };
                fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
                res.send('User levels updated successfully.');
            }
            else {
                res.status(404).send('User not found.');
            }
        } else {
            res.status(400).send('NaN')
        }
    } else {
        res.status(403).send('NOT AUTHERIZED/ADMIN');
    }
});

app.post('/update-user-admin-status', (req, res) => {
    if (isAuthenticated(req.ip) && isadmin(req.ip)) {
        const login = req.body.user;
        const password = req.body.password;
        const isadmin = req.body.isadmin;
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        const serchedUser = users.find(entry => entry.login === login && entry.password === password);
        if (serchedUser) {
            serchedUser.isadmin = isadmin;
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
            res.send('User admin status updated successfully.');
        } else {
            res.status(404).send('User not found.');
        }
    } else {
        res.status(403).send('NOT AUTHERIZED/ADMIN');
    }
})

app.post('/update-user-rank-hidden-status', (req, res) => {
    if (isAuthenticated(req.ip) && isadmin(req.ip)) {
        const login = req.body.user;
        const password = req.body.password;
        const isrankhidden = req.body.isrankhidden;
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        const serchedUser = users.find(entry => entry.login === login && entry.password === password);
        if (serchedUser) {
            serchedUser.isrankhidden = isrankhidden;
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
            res.send('User rank hidden status updated successfully.');
        } else {
            res.status(404).send('User not found.');
        }
    } else {
        res.status(403).send('NOT AUTHERIZED/ADMIN');
    }
});

// logout route
app.get('/logout', (req, res) => {
    const clientIp = req.ip;

    let users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    let user = users.filter(entry => !entry.ip.includes(clientIp));
    users.forEach(user => {
        user.ip = user.ip.filter(ip => ip !== clientIp);
    });
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
    console.log('User logged out:', clientIp);
    res.sendFile(path.join(__dirname, 'public/login-page', 'index.html'));
});

function isAuthenticated(ip) {
    try {
        if (!fs.existsSync('users.json')) return false;
        const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        return users.some(entry => entry.ip.includes(ip));
    } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
        return false;
    }
}
function isadmin(ip) {
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    const user = users.find(entry => entry.ip.includes(ip));
    let isadmin = user.isadmin || false;
    return isadmin;
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});