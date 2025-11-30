// handles all the main app functionality - adding, viewing, deleting sets

let editingSetId = null; // track which set we're editing

// handle adding new sets
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addSetForm').addEventListener('submit', addSet);
});

async function addSet(e) {
    e.preventDefault(); // stop page refresh

    // gather all the form data
    const setData = {
        user_id: currentUser.id,
        set_number: document.getElementById('setNumber').value,
        name: document.getElementById('setName').value,
        theme: document.getElementById('setTheme').value,
        year: document.getElementById('setYear').value || null,
        piece_count: document.getElementById('setPieceCount').value || null,
        image_url: document.getElementById('setImageUrl').value || null,
        status: document.getElementById('setStatus').value,
        notes: document.getElementById('setNotes').value || null,
        building_progress: 0
    };

    try {
        if (editingSetId) {
            // update existing set
            const { error } = await supabase
                .from('lego_sets')
                .update(setData)
                .eq('id', editingSetId);
            
            if (error) throw error;
            
            showLegoMessage('Set updated successfully!', 'success');
            editingSetId = null;
            
            // reset button text
            document.querySelector('#addSetForm button[type="submit"]').textContent = 'ADD TO COLLECTION';
        } else {
            // insert new set
            const { error } = await supabase.from('lego_sets').insert([setData]);
            if (error) throw error;
            
            showLegoMessage('Set added successfully!', 'success');
        }
        
        // clear the form
        document.getElementById('addSetForm').reset();
        
        // reload the sets to show changes
        loadSets();
    } catch (error) {
        showLegoMessage(error.message, 'error');
    }
}

// load all sets from the database
async function loadSets() {
    const filterStatus = document.getElementById('filterStatus').value;
    const searchQuery = document.getElementById('searchSets').value.toLowerCase();

    try {
        // start building the query
        let query = supabase
            .from('lego_sets')
            .select('*')
            .eq('user_id', currentUser.id);
        
        // filter by status if one is selected
        if (filterStatus) {
            query = query.eq('status', filterStatus);
        }

        // get the data
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // filter by search if there's text in the search box
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

// show all the sets on the page
function displaySets(sets) {
    const grid = document.getElementById('setsGrid');
    
    // if there are no sets, show a message
    if (sets.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No sets found</h3>
                <p>Start building your collection by adding your first set above</p>
            </div>
        `;
        return;
    }

    // create a card for each set
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
                <div class="card-actions">
                    <button class="btn-secondary" onclick='editSet(${JSON.stringify(set).replace(/'/g, "&apos;")})'>Edit</button>
                    <button class="btn-danger" onclick="deleteSet('${set.id}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// delete a set
async function deleteSet(id) {
    // show custom lego confirmation
    showLegoConfirm('Are you sure you want to delete this set?', async () => {
        try {
            const { error } = await supabase.from('lego_sets').delete().eq('id', id);
            if (error) throw error;
            
            showLegoMessage('Set deleted successfully!', 'success');
            loadSets(); // refresh the list
        } catch (error) {
            showLegoMessage(error.message, 'error');
        }
    });
}

// custom confirmation dialog
function showLegoConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <p>${message}</p>
            <div class="confirm-buttons">
                <button class="confirm-yes btn-danger">Delete</button>
                <button class="confirm-no btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    
    // handle button clicks
    overlay.querySelector('.confirm-yes').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
        onConfirm();
    };
    
    overlay.querySelector('.confirm-no').onclick = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    };
    
    // click outside to cancel
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    };
}

// edit a set - populate the form with existing data
function editSet(set) {
    editingSetId = set.id;
    
    // fill in the form with the set's current data
    document.getElementById('setNumber').value = set.set_number;
    document.getElementById('setName').value = set.name;
    document.getElementById('setTheme').value = set.theme;
    document.getElementById('setYear').value = set.year || '';
    document.getElementById('setPieceCount').value = set.piece_count || '';
    document.getElementById('setImageUrl').value = set.image_url || '';
    document.getElementById('setStatus').value = set.status;
    document.getElementById('setNotes').value = set.notes || '';
    
    // change button text
    document.querySelector('#addSetForm button[type="submit"]').textContent = 'UPDATE SET';
    
    // scroll to the form
    document.querySelector('.add-set-form').scrollIntoView({ behavior: 'smooth' });
}

// simple notification popup
function showLegoMessage(message, type) {
    // create the popup
    const popup = document.createElement('div');
    popup.className = `simple-notification notification-${type}`;
    popup.innerHTML = `<p>${message}</p>`;
    
    document.body.appendChild(popup);
    
    // animate in
    setTimeout(() => popup.classList.add('show'), 10);
    
    // remove after 4 seconds
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 4000);
}