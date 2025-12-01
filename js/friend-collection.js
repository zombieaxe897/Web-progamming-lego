// handles viewing a friend's collection

// currentUser is declared in config.js
let friendId = null;
let friendUsername = null;

// check authentication and load friend data
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = session.user;
    
    // get friend ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    friendId = urlParams.get('id');
    friendUsername = urlParams.get('name');
    
    if (!friendId) {
        window.location.href = 'friends.html';
        return;
    }
    
    await loadUserDisplay();
    document.getElementById('friendName').textContent = `@${friendUsername}'s Collection`;
    loadFriendSets();
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

// load friend's sets
async function loadFriendSets() {
    const filterStatus = document.getElementById('filterStatus').value;
    const searchQuery = document.getElementById('searchSets').value.toLowerCase();

    try {
        // verify friendship first
        const { data: friendship } = await supabase
            .from('friendships')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('friend_id', friendId)
            .maybeSingle();

        if (!friendship) {
            showLegoMessage('You are not friends with this user', 'error');
            setTimeout(() => window.location.href = 'friends.html', 2000);
            return;
        }

        // build query
        let query = supabase
            .from('lego_sets')
            .select('*')
            .eq('user_id', friendId);
        
        if (filterStatus) {
            query = query.eq('status', filterStatus);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // filter by search
        let filteredData = data;
        if (searchQuery) {
            filteredData = data.filter(set => 
                set.name.toLowerCase().includes(searchQuery) ||
                set.set_number.toLowerCase().includes(searchQuery) ||
                set.theme.toLowerCase().includes(searchQuery)
            );
        }

        displaySets(filteredData);
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// display sets
function displaySets(sets) {
    const grid = document.getElementById('setsGrid');
    
    if (sets.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No sets found</h3>
                <p>@${friendUsername} hasn't added any sets yet</p>
            </div>
        `;
        return;
    }

    // create a card for each set (read-only, no edit/delete buttons)
    grid.innerHTML = sets.map(set => `
        <div class="set-card">
            ${set.image_url ? 
                `<img src="${set.image_url}" class="set-image" alt="${set.name}">` : 
                '<div class="set-image"></div>'
            }
            <div class="set-content">
                <div class="set-info">
                    <h3>${set.name}</h3>
                    <p class="set-details"><strong>SET</strong> ${set.set_number}</p>
                    <p class="set-details"><strong>THEME</strong> ${set.theme}</p>
                    ${set.year ? `<p class="set-details"><strong>YEAR</strong> ${set.year}</p>` : ''}
                    ${set.piece_count ? `<p class="set-details"><strong>PIECES</strong> ${set.piece_count}</p>` : ''}
                    ${set.notes ? `<p class="set-details"><strong>NOTES</strong> ${set.notes}</p>` : ''}
                    <span class="status-badge status-${set.status}">${set.status}</span>
                </div>
            </div>
        </div>
    `).join('');
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