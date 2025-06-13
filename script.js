// script.js

document.addEventListener('DOMContentLoaded', () => {
    const commandInput = document.getElementById('command-input');
    const commandOutput = document.getElementById('command-output');
    const eraseCommandsButton = document.getElementById('erase-commands-button');
    const timezoneSelect = document.getElementById('timezone-select');
    const currentTimeSpan = document.getElementById('current-time');
    const orbText = document.querySelector('.orb-text');
    const greetingElement = document.querySelector('.greeting');
    const volumeSlider = document.getElementById('volume-slider');
    const playMusicButton = document.getElementById('play-music-button');
    const pauseMusicButton = document.getElementById('pause-music-button');
    const currentPlayingSongSpan = document.getElementById('current-playing-song');
    const soundButtons = document.querySelectorAll('.sound-button');
    const jokeOutput = document.getElementById('joke-output');
    const stockInfo = document.getElementById('stock-info');
    const actionButtons = document.querySelectorAll('.action-button[data-href]');

    let activeSound = null;
    let audioElements = {};

    document.querySelectorAll('audio').forEach(audio => {
        audioElements[audio.id] = audio;
        audio.loop = true;
        audio.volume = volumeSlider.value;
    });

    function populateTimezones() {
        const timezones = Intl.supportedValuesOf('timeZone');
        const fragment = document.createDocumentFragment();
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz;
            fragment.appendChild(option);
        });
        timezoneSelect.appendChild(fragment);
        const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezones.includes(localTimezone)) {
            timezoneSelect.value = localTimezone;
        } else {
            timezoneSelect.value = 'Asia/Manila';
        }
    }

    function updateTime() {
        const selectedTimezone = timezoneSelect.value;
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: selectedTimezone
        };
        currentTimeSpan.textContent = new Intl.DateTimeFormat('en-US', options).format(now);
    }

    timezoneSelect.addEventListener('change', updateTime);
    setInterval(updateTime, 1000);

    const commands = {
        '/help': {
            description: 'Displays all available commands.',
            execute: () => {
                let helpText = 'Available Commands:\n';
                for (const cmd in commands) {
                    helpText += `${cmd}: ${commands[cmd].description}\n`;
                }
                appendToOutput(helpText);
            },
            category: 'General'
        },
        '/clear': {
            description: 'Clears the command output screen.',
            execute: () => {
                commandOutput.textContent = '';
            },
            category: 'Utility'
        },
        '/echo [text]': {
            description: 'Repeats the provided text.',
            execute: (args) => {
                const text = args.join(' ');
                appendToOutput(`Echo: ${text}`);
            },
            category: 'Utility'
        },
        '/time': {
            description: 'Displays the current system time.',
            execute: () => {
                appendToOutput(`Current system time: ${currentTimeSpan.textContent}`);
            },
            category: 'Information'
        },
        '/date': {
            description: 'Displays the current system date.',
            execute: () => {
                const now = new Date();
                const options = {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: timezoneSelect.value
                };
                appendToOutput(`Current system date: ${new Intl.DateTimeFormat('en-US', options).format(now)}`);
            },
            category: 'Information'
        },
        '/whoami': {
            description: 'Identifies the current user or system status.',
            execute: () => {
                appendToOutput("You are authorized personnel. Access level: Alpha. All systems operational.");
            },
            category: 'Information'
        },
        '/joke': {
            description: 'Tells a random joke.',
            execute: async () => {
                const joke = await fetchJoke();
                appendToOutput(`HiBro: ${joke}`);
            },
            category: 'Fun'
        },
        '/play [sound]': {
            description: 'Plays a background sound (city, rain, fireplace).',
            execute: (args) => {
                const sound = args[0];
                if (sound && audioElements[`${sound}-sound`]) {
                    playSound(`${sound}-sound`);
                    appendToOutput(`Playing ${sound} sound.`);
                } else {
                    appendToOutput('Usage: /play [city|rain|fireplace]');
                }
            },
            category: 'Music'
        },
        '/pause': {
            description: 'Pauses the current background sound.',
            execute: () => {
                pauseSound();
                appendToOutput('Background sound paused.');
            },
            category: 'Music'
        },
        '/stocks [symbol]': {
            description: 'Fetches stock data for a given symbol (e.g., /stocks AAPL).',
            execute: async (args) => {
                const symbol = args[0]?.toUpperCase();
                if (symbol) {
                    appendToOutput(`Fetching stock data for ${symbol}...`);
                    // Simulate API call
                    const data = await simulateStockAPI(symbol);
                    if (data) {
                        appendToOutput(`${symbol}: Price: $${data.price.toFixed(2)}, Change: ${data.change.toFixed(2)} (${data.percentage.toFixed(2)}%)`);
                        stockInfo.textContent = `${symbol}: $${data.price.toFixed(2)} (${data.percentage.toFixed(2)}%)`;
                    } else {
                        appendToOutput(`Could not retrieve data for ${symbol}.`);
                        stockInfo.textContent = `Type /stocks [symbol] for data.`;
                    }
                } else {
                    appendToOutput('Usage: /stocks [symbol]');
                }
            },
            category: 'Information'
        },
        '/open [url]': {
            description: 'Opens a URL in a new tab. Example: /open google.com',
            execute: (args) => {
                let url = args[0];
                if (url) {
                    // Prepend https:// if not already present for proper URL opening
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    try {
                        window.open(url, '_blank');
                        appendToOutput(`Opening ${url}`);
                    } catch (e) {
                        appendToOutput(`Error opening URL: ${e.message}`);
                    }
                } else {
                    appendToOutput('Usage: /open [url]');
                }
            },
            category: 'Utility'
        }
    };

    function appendToOutput(message) {
        commandOutput.textContent += `\n> ${message}`;
        commandOutput.scrollTop = commandOutput.scrollHeight;
    }

    commandInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const commandText = commandInput.value.trim();
            appendToOutput(`\nUser: ${commandText}`);
            commandInput.value = '';

            executeCommand(commandText);
            hideSuggestions();
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            navigateSuggestions(event.key);
            event.preventDefault(); // Prevent cursor movement in input field
        }
    });

    eraseCommandsButton.addEventListener('click', () => {
        commandOutput.textContent = 'HiBro OS v3.1.0 Initializing...\nSystem checks complete. All systems nominal. Type /help for command list.';
        appendToOutput('Command history erased.');
    });

    function executeCommand(commandText) {
        const parts = commandText.split(' ');
        const baseCommand = parts[0];
        const args = parts.slice(1);

        if (baseCommand === '/play' && args.length > 0) {
            commands['/play [sound]'].execute(args);
            return;
        }
        if (baseCommand === '/echo' && args.length > 0) {
            commands['/echo [text]'].execute(args);
            return;
        }
        if (baseCommand === '/stocks' && args.length > 0) {
            commands['/stocks [symbol]'].execute(args);
            return;
        }
        if (baseCommand === '/open' && args.length > 0) {
            commands['/open [url]'].execute(args);
            return;
        }

        // Exact command match
        if (commands[baseCommand] && typeof commands[baseCommand].execute === 'function') {
            commands[baseCommand].execute(args);
        } else {
            appendToOutput(`Error: Command not recognized: ${baseCommand}. Type /help for a list of commands.`);
        }
    }

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) {
            greeting = "Good morning, Bro!";
        } else if (hour < 18) {
            greeting = "Good afternoon, Bro!";
        } else {
            greeting = "Good evening, Bro!";
        }
        greetingElement.textContent = `${greeting} System's ready to roll.`;
    }

    volumeSlider.addEventListener('input', (event) => {
        const volume = event.target.value;
        for (const key in audioElements) {
            audioElements[key].volume = volume;
        }
    });

    playMusicButton.addEventListener('click', () => {
        if (activeSound) {
            audioElements[activeSound].play();
            currentPlayingSongSpan.textContent = activeSound.replace('-sound', '');
        } else if (Object.keys(audioElements).length > 0) {
            const firstSoundId = Object.keys(audioElements)[0];
            activeSound = firstSoundId;
            audioElements[firstSoundId].play();
            currentPlayingSongSpan.textContent = firstSoundId.replace('-sound', '');
        }
    });

    pauseMusicButton.addEventListener('click', () => {
        if (activeSound && audioElements[activeSound]) {
            audioElements[activeSound].pause();
            currentPlayingSongSpan.textContent = `Paused: ${activeSound.replace('-sound', '')}`;
        }
    });

    soundButtons.forEach(button => {
        button.addEventListener('click', () => {
            const soundId = button.dataset.sound;
            playSound(soundId);
            soundButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    function playSound(soundId) {
        if (activeSound && audioElements[activeSound]) {
            audioElements[activeSound].pause();
        }


        if (audioElements[soundId]) {
            activeSound = soundId;
            audioElements[soundId].currentTime = 0;
            audioElements[soundId].play();
            currentPlayingSongSpan.textContent = soundId.replace('-sound', '');
        }
    }

    // --- Joke API (Simulated) ---
    async function fetchJoke() {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Did you hear about the mathematician who’s afraid of negative numbers? He’ll stop at nothing to avoid them.",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "What do you call a fake noodle? An impasta!",
            "I'm reading a book on anti-gravity. It's impossible to put down!",
            "Why did the data scientist break up with the statistician? Because they had too many issues!",
            "What do you call a sad strawberry? A blueberry!"
        ];
        // Simulate API delay
        return new Promise(resolve => {
            setTimeout(() => {
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                resolve(randomJoke);
            }, 500);
        });
    }

    fetchJoke().then(joke => {
        jokeOutput.textContent = joke;
    });

    // --- Stock API (Simulated) ---
    async function simulateStockAPI(symbol) {
        // Simulate fetching data for a few symbols
        const stockData = {
            'AAPL': { price: 170.25, change: 1.50, percentage: 0.89 },
            'GOOG': { price: 155.10, change: -0.80, percentage: -0.51 },
            'MSFT': { price: 420.00, change: 3.20, percentage: 0.77 },
            'AMZN': { price: 185.70, change: 0.95, percentage: 0.51 },
            'TSLA': { price: 175.50, change: -2.10, percentage: -1.18 }
        };
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(stockData[symbol]);
            }, 700); // Simulate network delay
        });
    }

    const commandSuggestions = document.getElementById('command-suggestions');
    let highlightedSuggestionIndex = -1;

    function showSuggestions(input) {
        const inputText = input.toLowerCase();
        commandSuggestions.innerHTML = '';
        highlightedSuggestionIndex = -1;

        const filteredCommands = Object.keys(commands).filter(cmd =>
            cmd.toLowerCase().includes(inputText)
        ).sort((a, b) => {
            const aStartsWith = a.toLowerCase().startsWith(inputText);
            const bStartsWith = b.toLowerCase().startsWith(inputText);
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.localeCompare(b);
        });

        if (filteredCommands.length === 0 || inputText === '') {
            hideSuggestions();
            return;
        }

        const categories = {};
        filteredCommands.forEach(cmd => {
            let actualCmd = cmd;
            let description = commands[cmd].description;
            let category = commands[cmd].category || 'Other';

            if (cmd.includes('[') && cmd.includes(']')) {
                actualCmd = cmd.substring(0, cmd.indexOf('[')).trim();
                description = commands[cmd].description;
            }

            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ cmd: actualCmd, fullCmd: cmd, description: description });
        });

        for (const category in categories) {
            const categoryHeading = document.createElement('div');
            categoryHeading.classList.add('command-category-heading');
            categoryHeading.textContent = category.toUpperCase();
            commandSuggestions.appendChild(categoryHeading);

            categories[category].forEach((item, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('command-suggestion-item');
                suggestionItem.setAttribute('data-command', item.fullCmd);

                const commandName = document.createElement('span');
                commandName.classList.add('command-name');
                commandName.textContent = item.cmd;
                suggestionItem.appendChild(commandName);

                const commandDescription = document.createElement('span');
                commandDescription.classList.add('command-description');
                commandDescription.textContent = item.description;
                suggestionItem.appendChild(commandDescription);

                suggestionItem.addEventListener('click', () => {
                    commandInput.value = item.fullCmd.split(' ')[0] + ' ';
                    commandInput.focus();
                    hideSuggestions();
                });
                commandSuggestions.appendChild(suggestionItem);
            });
        }

        commandSuggestions.style.display = 'block';
    }

    function hideSuggestions() {
        commandSuggestions.style.display = 'none';
        highlightedSuggestionIndex = -1;
    }

    function navigateSuggestions(key) {
        const items = Array.from(commandSuggestions.querySelectorAll('.command-suggestion-item'));
        if (items.length === 0) return;

        items.forEach(item => item.classList.remove('highlighted'));

        if (key === 'ArrowDown') {
            highlightedSuggestionIndex = (highlightedSuggestionIndex + 1) % items.length;
        } else if (key === 'ArrowUp') {
            highlightedSuggestionIndex = (highlightedSuggestionIndex - 1 + items.length) % items.length;
        }

        const highlightedItem = items[highlightedSuggestionIndex];
        if (highlightedItem) {
            highlightedItem.classList.add('highlighted');
            highlightedItem.scrollIntoView({ block: 'nearest' });
            commandInput.value = highlightedItem.getAttribute('data-command').split(' ')[0] + ' ';
        }
    }

    commandInput.addEventListener('input', () => {
        showSuggestions(commandInput.value);
    });


    document.addEventListener('click', (event) => {
        if (!commandInput.contains(event.target) && !commandSuggestions.contains(event.target)) {
            hideSuggestions();
        }
    });


    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const href = button.dataset.href;
            if (href) {
                window.open(href, '_blank');
                appendToOutput(`Opening ${href}`);
            }
        });
    });

    populateTimezones();
    updateTime(); 
    updateGreeting(); 
});