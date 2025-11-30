// handles all the login/signup stuff

let isLogin = true; // tracks if we're on login or signup mode

// check if someone is already logged in when the page loads
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // user is logged in, show the app
        currentUser = session.user;
        showApp();
        loadSets();
    }
}

// switch between login and signup forms
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authToggleLink').addEventListener('click', toggleAuthMode);
});

function toggleAuthMode() {
    isLogin = !isLogin;
    
    // update the form text
    document.getElementById('authTitle').textContent = isLogin ? 'Login' : 'Sign Up';
    document.getElementById('authSubmit').textContent = isLogin ? 'Login' : 'Sign Up';
    
    // update the toggle link
    document.getElementById('authToggleText').innerHTML = isLogin 
        ? 'Don\'t have an account? <a id="authToggleLink">Sign up</a>'
        : 'Already have an account? <a id="authToggleLink">Login</a>';
    
    // re-attach the click listener
    document.getElementById('authToggleLink').addEventListener('click', toggleAuthMode);
}

// handle form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('authForm').addEventListener('submit', handleAuth);
});

async function handleAuth(e) {
    e.preventDefault(); // stop the page from refreshing
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
        if (isLogin) {
            // log the user in
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            currentUser = data.user;
            showApp();
            loadSets();
        } else {
            // create a new account
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            
            showLegoMessage('Account created! Please check your email to verify.', 'success');
        }
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// log the user out
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    
    // hide the app and show login form
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    
    // clear the form
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
}

// show the main app (hide login form)
function showApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
}

// show success or error messages
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="${type}-message">${message}</div>`;
    
    // remove the message after 5 seconds
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

// run this when the page loads
checkAuth();