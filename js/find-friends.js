// handles finding and adding friends

// currentUser is declared in config.js
let currentUsername = null;

// check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;
    await loadUserDisplay();
}

// load user display name
async function loadUserDisplay() {
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUser.id)
        .maybeSingle();

    if (profile && profile.username) {
        document.getElementById('userDisplay').textContent = `@${profile.username}`;
        currentUsername = profile.username;
    } else {
        document.getElementById('userDisplay').textContent = currentUser.email;
    }
}

// search for users
async function searchUsers() {
    const query = document.getElementById('searchUsers').value.trim().toLowerCase();
    
    if (!query) {
        document.getElementById('searchResults').innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Enter a username to search</p>';
        return;
    }

    if (!currentUsername) {
        showLegoMessage('Please set up your username first', 'error');
        return;
    }

    try {
        // search for users by username
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, bio, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(20);

        if (error) throw error;

        // filter out current user
        const filteredUsers = users.filter(u => u.id !== currentUser.id);

        if (filteredUsers.length === 0) {
            document.getElementById('searchResults').innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No users found</p>';
            return;
        }

        // get existing friendships and pending requests
        const { data: friendships } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', currentUser.id);

        const { data: sentRequests } = await supabase
            .from('friend_requests')
            .select('receiver_id')
            .eq('sender_id', currentUser.id)
            .eq('status', 'pending');

        const friendIds = new Set(friendships?.map(f => f.friend_id) || []);
        const pendingIds = new Set(sentRequests?.map(r => r.receiver_id) || []);

        displaySearchResults(filteredUsers, friendIds, pendingIds);
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// display search results
function displaySearchResults(users, friendIds, pendingIds) {
    const resultsContainer = document.getElementById('searchResults');
    
    resultsContainer.innerHTML = users.map(user => {
        let buttonHtml;
        if (friendIds.has(user.id)) {
            buttonHtml = '<button class="btn-secondary" disabled>Already Friends</button>';
        } else if (pendingIds.has(user.id)) {
            buttonHtml = '<button class="btn-secondary" disabled>Request Sent</button>';
        } else {
            buttonHtml = `<button class="btn-blue" onclick="sendFriendRequest('${user.id}', '${user.username}')">Add Friend</button>`;
        }

        return `
            <div class="set-card">
                ${user.avatar_url ? 
                    `<img src="${user.avatar_url}" class="set-image" alt="${user.username}">` : 
                    '<div class="set-image" style="display: flex; align-items: center; justify-content: center; font-size: 4em; color: rgba(255,255,255,0.3);">👤</div>'
                }
                <div class="set-content">
                    <div class="set-info">
                        <h3>@${user.username}</h3>
                        ${user.bio ? `<p class="set-details" style="color: #999; margin-top: 10px;">${user.bio}</p>` : ''}
                    </div>
                    <div class="card-actions">
                        ${buttonHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// send friend request
async function sendFriendRequest(receiverId, username) {
    try {
        const { error } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: currentUser.id,
                receiver_id: receiverId,
                status: 'pending'
            });

        if (error) throw error;

        showLegoMessage(`Friend request sent to @${username}!`, 'success');
        searchUsers(); // refresh results
    } catch (error) {
        if (error.code === '23505') {
            showLegoMessage('Friend request already sent', 'error');
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
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 4000);
}

// run on page load
checkAuth();