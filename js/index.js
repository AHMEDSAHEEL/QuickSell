// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDRGzwePftO0o42hMGCQHx-K845Xjl4zEQ",
    authDomain: "quicksell-374b8.firebaseapp.com",
    projectId: "quicksell-374b8",
    storageBucket: "quicksell-374b8.appspot.com",
    messagingSenderId: "984641749083",
    appId: "1:984641749083:web:6fa3360232f0fc8fceff7e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* Animation for container */
document.getElementById('show-signup').addEventListener('click', function() {
    document.getElementById('signup-container').style.display = 'block';
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('login-container').classList.add('out');
    setTimeout(() => {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('signup-container').classList.remove('hidden', 'out');
        document.getElementById('signup-container').classList.add('active');
    }, 500); // Delay to match the animation duration
});

document.getElementById('show-login').addEventListener('click', function() {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('signup-container').classList.add('out');
    document.getElementById('signup-container').style.display = 'none';
    setTimeout(() => {
        document.getElementById('signup-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden', 'out');
        document.getElementById('login-container').classList.add('active');
    }, 500); // Delay to match the animation duration
});

// Emoji change on input for login and signup
function updateEmojiOnInput(elementId, emojiId) {
    document.getElementById(elementId).addEventListener('input', function() {
        const emoji = document.getElementById(emojiId);
        emoji.textContent = this.value ? '👨‍💻👩‍💻' : '🙋‍♂🙋‍♀';
    });
}

updateEmojiOnInput('login-email', 'emoji-icon');
updateEmojiOnInput('login-password', 'emoji-icon');
updateEmojiOnInput('signup-username', 'signup-emoji-icon');
updateEmojiOnInput('signup-email', 'signup-emoji-icon');
updateEmojiOnInput('signup-password', 'signup-emoji-icon');

// Spinner visibility on form submit
function showSpinner(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideSpinner(id) {
    document.getElementById(id).classList.add('hidden');
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission for demo purposes

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const success = document.getElementById('success');
    const failure = document.getElementById('failure');

    success.style.display = "none";
    failure.style.display = "none";
    showSpinner('login-spinner');

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Check if user is an admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        const isAdmin = userDoc.data().isAdmin;

        if (isAdmin) {
            alert('You are an admin');
        } else {
            alert('You are a regular user');
        }

        setTimeout(() => {
            document.getElementById('emoji-icon').textContent = "👫";
            success.style.display = "block";
            success.textContent = "Login Successfully";
            document.getElementById('welcome').style.display = "none";
        }, 2000);

        setTimeout(function() {
            success.style.display = "none";
            document.getElementById('welcome').style.display = "block";
            window.location.href = "html/home.html";
            hideSpinner('login-spinner');
            document.getElementById('login-form').reset();
        }, 3500);
    } catch (error) {
        setTimeout(function() {
            document.getElementById('welcome').style.display = "none";
            failure.style.display = "block";
            failure.textContent = "Incorrect Email or Password";
            document.getElementById('emoji-icon').textContent = '🤦‍♂🤦‍♀';
            hideSpinner('login-spinner');
        }, 2000);
    }
});

// Signup form submission
document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const mobile = document.getElementById('signup-mobile').value; // Fix ID for mobile input

    showSpinner('signup-spinner');

    try {
        // Check for existing email
        const userQuery = await db.collection('users').where('email', '==', email).get();
        if (!userQuery.empty) {
            alert("email alreay exixts");
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Add user data to Firestore with custom ID
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            password: password,
            mobile: mobile,
            isAdmin: false // Set to true if needed
        });

        document.getElementById('signup-emoji-icon').textContent = "👫";
        document.getElementById('success').textContent = "Signup Successful";
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 2000);
    } catch (error) {
        document.getElementById('failure').textContent = error.message;
        document.getElementById('signup-emoji-icon').textContent = '🤦‍♂🤦‍♀';
    } finally {
        hideSpinner('signup-spinner');
    }
});

// Password visibility toggle
function setupPasswordToggle(id) {
    const passwordInput = document.getElementById(id);
    const toggle = document.getElementById(`toggle-${id}`);

    toggle.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggle.textContent = '🙈'; // Change to "hide" icon
        } else {
            passwordInput.type = 'password';
            toggle.textContent = '👁️'; // Change to "show" icon
        }
    });
}

setupPasswordToggle('login-password');
setupPasswordToggle('signup-password');
