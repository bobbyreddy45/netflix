const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (validateEmail(email) && validatePassword(password)) {
        // Simulate login delay or check
        const submitBtn = document.querySelector('.signin-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Signing In...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // Save user session (optional)
            localStorage.setItem('netflixUser', JSON.stringify({ email: email }));

            // Redirect to the main application
            window.location.href = 'index.html';
        }, 1000); // 1 second delay for effect
    }
});

function validateEmail(email) {
    // Basic email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }
    return true;
}

function validatePassword(password) {
    if (password.length < 4) {
        alert("Password must be at least 4 characters.");
        return false;
    }
    return true;
}
