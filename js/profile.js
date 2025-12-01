// handles profile management
// NOTE: currentUser is declared in config.js

// check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;
    loadProfile();
}

// load user profile
async function loadProfile() {
    try {
        // get profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (profile) {
            // fill in the form with existing data
            document.getElementById('username').value = profile.username || '';
            document.getElementById('bio').value = profile.bio || '';
            document.getElementById('avatarUrl').value = profile.avatar_url || '';
            
            // update display with username
            document.getElementById('userDisplay').textContent = `@${profile.username}`;
        } else {
            // no profile yet, show email
            document.getElementById('userDisplay').textContent = currentUser.email;
        }

        // show email in the disabled field
        document.getElementById('userEmail').value = currentUser.email;
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('userDisplay').textContent = currentUser.email;
    }
}

// handle profile form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    checkAuth();
});

async function saveProfile(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const avatarUrl = document.getElementById('avatarUrl').value.trim();

    // validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        showLegoMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores', 'error');
        return;
    }

    try {
        // check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (existingProfile) {
            // update existing profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: username,
                    bio: bio || null,
                    avatar_url: avatarUrl || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);

            if (error) throw error;
        } else {
            // create new profile
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.id,
                    username: username,
                    bio: bio || null,
                    avatar_url: avatarUrl || null
                });

            if (error) throw error;
        }

        // Show success message first
        showLegoMessage('✅ Profile saved successfully!', 'success');
        
        // Reload the profile to show updated data
        await loadProfile();
        
    } catch (error) {
        if (error.code === '23505') {
            showLegoMessage('Username already taken. Please choose another.', 'error');
        } else {
            showLegoMessage(error.message, 'error');
        }
    }
}

// logout function
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// notification popup
function showLegoMessage(message, type) {
    const popup = document.createElement('div');
    popup.className = `simple-notification notification-${type}`;
    popup.innerHTML = `<p>${message}</p>`;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
    
    // Keep success messages longer (6 seconds), errors 5 seconds
    const duration = type === 'success' ? 6000 : 5000;
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, duration);
}