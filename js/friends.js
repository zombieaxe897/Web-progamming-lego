// handles friends list and friend requests
// currentUser is declared in config.js

// check authentication
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;
    loadUserDisplay();
    loadFriendRequests();
    loadFriends();
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
    } else {
        document.getElementById('userDisplay').textContent = currentUser.email;
    }
}

// load friend requests
async function loadFriendRequests() {
    try {
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select('id, sender_id, created_at')
            .eq('receiver_id', currentUser.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const requestsList = document.getElementById('requestsList');
        
        if (!requests || requests.length === 0) {
            requestsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No pending friend requests</p>';
            return;
        }

        // Get profile data for each sender
        const requestsWithProfiles = await Promise.all(requests.map(async (req) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', req.sender_id)
                .single();
            return { ...req, profile };
        }));

        requestsList.innerHTML = requestsWithProfiles.map(req => `
            <div class="friend-request-card" style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #fff; font-size: 1.2em;">@${req.profile?.username || 'Unknown'}</strong>
                    <p style="color: #999; font-size: 0.9em; margin-top: 5px;">Sent ${new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-blue" onclick="acceptRequest('${req.id}')">Accept</button>
                    <button class="btn-danger" onclick="declineRequest('${req.id}')">Decline</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading friend requests:', error);
        showLegoMessage(error.message, 'error');
    }
}

// load friends list
async function loadFriends() {
    try {
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select('id, friend_id, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const friendsList = document.getElementById('friendsList');
        
        if (!friendships || friendships.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-state">
                    <h3>No friends yet</h3>
                    <p>Head over to <a href="find-friends.html" style="color: #dc0a2d;">Find Friends</a> to start connecting!</p>
                </div>
            `;
            return;
        }

        // Get profile data for each friend
        const friendsWithProfiles = await Promise.all(friendships.map(async (friendship) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url, bio')
                .eq('id', friendship.friend_id)
                .single();
            return { ...friendship, profile };
        }));

        friendsList.innerHTML = friendsWithProfiles.map(friendship => `
            <div class="set-card">
                ${friendship.profile?.avatar_url ? 
                    `<img src="${friendship.profile.avatar_url}" class="set-image" alt="${friendship.profile.username}">` : 
                    '<div class="set-image" style="display: flex; align-items: center; justify-content: center; font-size: 4em; color: rgba(255,255,255,0.3);">👤</div>'
                }
                <div class="set-content">
                    <div class="set-info">
                        <h3>@${friendship.profile?.username || 'Unknown'}</h3>
                        ${friendship.profile?.bio ? `<p class="set-details" style="color: #999;">${friendship.profile.bio}</p>` : ''}
                        <p class="set-details"><strong>FRIENDS SINCE</strong> ${new Date(friendship.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="card-actions">
                        <button class="btn-blue" onclick="viewCollection('${friendship.friend_id}', '${friendship.profile?.username || 'friend'}')">View Collection</button>
                        <button class="btn-danger" onclick="removeFriend('${friendship.id}', '${friendship.profile?.username || 'this friend'}')">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading friends:', error);
        showLegoMessage(error.message, 'error');
    }
}

// accept friend request
async function acceptRequest(requestId) {
    try {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) throw error;

        showLegoMessage('Friend request accepted!', 'success');
        loadFriendRequests();
        loadFriends();
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// decline friend request
async function declineRequest(requestId) {
    try {
        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId);

        if (error) throw error;

        showLegoMessage('Friend request declined', 'info');
        loadFriendRequests();
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// remove friend
async function removeFriend(friendshipId, username) {
    showLegoConfirm(`Remove @${username} from your friends?`, async () => {
        try {
            const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

            if (error) throw error;

            showLegoMessage('Friend removed', 'info');
            loadFriends();
        } catch (error) {
            showLegoMessage(error.message, 'error');
        }
    });
}

// view friend's collection
function viewCollection(friendId, username) {
    window.location.href = `friend-collection.html?id=${friendId}&name=${encodeURIComponent(username)}`;
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

// confirmation dialog
function showLegoConfirm(message, onConfirm) {
    const existingOverlay = document.querySelector('.lego-confirm-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'lego-confirm-overlay';
    overlay.innerHTML = `
        <div class="lego-confirm-dialog">
            <p>${message}</p>
            <div class="lego-confirm-buttons">
                <button class="confirm-yes btn-danger">Confirm</button>
                <button class="confirm-no btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    
    overlay.querySelector('.confirm-yes').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
        onConfirm();
    };
    
    overlay.querySelector('.confirm-no').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    };
}

// run on page load
checkAuth();