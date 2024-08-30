document.getElementById('show-signup').addEventListener('click', function() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('signup-container').classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', function() {
    document.getElementById('signup-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
});

// Emoji change on input
document.getElementById('login-email').addEventListener('input', function() {
    document.getElementById('emoji-icon').textContent = this.value && document.getElementById('login-email').value ? '👨‍💻👩‍💻' : '🙋‍♂🙋‍♀';
});

document.getElementById('login-password').addEventListener('input', function() {
    document.getElementById('emoji-icon').textContent = this.value && document.getElementById('login-password').value ? '👨‍💻👩‍💻' : '🙋‍♂🙋‍♀';
});

// Emoji change on error
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission for demo purposes

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const success=document.getElementById('success');
    const failure=document.getElementById('failure');

    // Dummy validation for example purposes
    if (email === "shaheel123as@gmail.com" && password === "Abc123###.") {
        document.getElementById('emoji-icon').textContent="👫";
        success.style.display="block";
        success.textContent = "Login Successfully"; 
        document.getElementById('welcome').style.display="none";
        setTimeout(function() {
            // Perform actions after the timeout
            document.getElementById('login-form').reset();
             document.getElementById('emoji-icon').textContent="🙋‍♂🙋‍♀";
             success.style.display="none"; 
             document.getElementById('welcome').style.display="block";// Update emoji after delay
        }, 2000); 
      
       //alert("Login successful!");
    } else {
        document.getElementById('welcome').style.display="none";
        failure.style.display="block";
        failure.textContent = "Incorrect Email or Password"; 
        document.getElementById('emoji-icon').textContent = '🤦‍♂🤦‍♀';
        setTimeout(function() {
            // Perform actions after the timeout
            document.getElementById('emoji-icon').textContent="🙋‍♂🙋‍♀";
            document.getElementById('welcome').style.display="block";
            failure.style.display="none";// Update emoji after delay
        }, 2000); 
       // alert("Login failed. Please check your email and password.");
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
